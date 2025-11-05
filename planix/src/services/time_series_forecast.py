import sys
import json
import os
from typing import List, Dict, Any
import numpy as np
# joblib may not be installed in the runtime Python; handle gracefully
try:
	import joblib  # type: ignore
except Exception:  # pragma: no cover
	joblib = None  # type: ignore


def read_input() -> Dict[str, Any]:
	try:
		# If there's input in stdin, use it
		if not sys.stdin.isatty():
			data = sys.stdin.read()
			return json.loads(data)
		
		# If no input provided, use sample test data
		return {
			"total_points": 100.0,
			"sprint_days": 14,
			"actuals": [100.0, 95.0, 85.0, 75.0, 65.0, 60.0, 50.0]  # 7 days of progress
		}
	except Exception as exc:
		raise RuntimeError(f"Failed to parse input JSON: {exc}")


def generate_ideal_series(total_points: float, sprint_days: int) -> List[float]:
	# Linear ideal burn from total_points to 0 over sprint_days
	if sprint_days <= 1:
		return [max(0.0, total_points - total_points)]
	step = total_points / (sprint_days - 1)
	return [max(0.0, total_points - step * i) for i in range(sprint_days)]


def simple_forecast(actuals: List[float], forecast_horizon: int) -> List[float]:
	"""
	Forecast remaining points using a simple linear regression over the observed actuals.
	- actuals: remaining points observed per day (monotonic non-increasing expected)
	- forecast_horizon: number of future days to predict
	Returns: list of predicted remaining points for the next forecast_horizon days
	"""
	if len(actuals) == 0:
		return []

	x = np.arange(len(actuals))
	y = np.array(actuals, dtype=float)

	# Fallback to last value if constant or too short
	if len(actuals) < 2 or np.allclose(y, y[0]):
		return [float(y[-1]) for _ in range(forecast_horizon)]

	# Linear fit: remaining_points = a * day + b
	a, b = np.polyfit(x, y, 1)

	future_x = np.arange(len(actuals), len(actuals) + forecast_horizon)
	pred = a * future_x + b

	# Remaining points cannot be negative
	pred = np.maximum(pred, 0.0)

	# Enforce non-increasing sequence from the last observed actual
	result: List[float] = []
	last = float(y[-1])
	for p in pred:
		p = float(p)
		if p > last:
			p = last
		last = p
		result.append(p)
	return result


# Optional: load a saved notebook model (e.g., Prophet) if available
# MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models', 'ts_model.pkl'))
MODEL_PATH = 'ts_model.pkl'
_LOADED_MODEL = None
try:
	if joblib is not None and os.path.exists(MODEL_PATH):
		_LOADED_MODEL = joblib.load(MODEL_PATH)
except Exception:
	_LOADED_MODEL = None


def prophet_like_forecast(remaining_days: int, last_remaining: float) -> List[float]:
	"""
	Best-effort forecast using a saved model (e.g., Prophet) if present.
	We generate a decreasing sequence towards zero over remaining_days, shaped by the model's trend if possible.
	"""
	if remaining_days <= 0:
		return []

	# If no model loaded, produce a gentle linear decline
	if _LOADED_MODEL is None:
		step = last_remaining / max(1, remaining_days)
		pred = [max(0.0, last_remaining - step * (i + 1)) for i in range(remaining_days)]
		return pred

	# Try to use Prophet-like interface if available
	model = _LOADED_MODEL
	try:
		# Prophet models expose make_future_dataframe + predict(ds)
		if hasattr(model, 'make_future_dataframe') and hasattr(model, 'predict'):
			future_df = model.make_future_dataframe(periods=remaining_days, freq='D')
			forecast_df = model.predict(future_df)
			# take only the horizon tail
			yhat = forecast_df['yhat'].tail(remaining_days).to_numpy(dtype=float)
			# Normalize yhat to [0, last_remaining] and invert to represent remaining points.
			# If yhat is constant, fall back to linear decline.
			y_min = float(np.min(yhat))
			y_max = float(np.max(yhat))
			if np.isclose(y_max, y_min):
				step = last_remaining / max(1, remaining_days)
				pred = [max(0.0, last_remaining - step * (i + 1)) for i in range(remaining_days)]
				return pred
			# Scale yhat to [0, 1]
			norm = (yhat - y_min) / (y_max - y_min)
			# Map to a decreasing curve from last_remaining down to ~0
			decreasing = 1.0 - norm
			raw = decreasing * last_remaining
			# Enforce monotonic non-increasing and non-negative
			pred: List[float] = []
			last = float(last_remaining)
			for v in raw:
				v = float(max(0.0, v))
				if v > last:
					v = last
				last = v
				pred.append(v)
			return pred
		else:
			# Unknown model type; fall back to linear decline
			step = last_remaining / max(1, remaining_days)
			return [max(0.0, last_remaining - step * (i + 1)) for i in range(remaining_days)]
	except Exception:
		# On any failure, fall back to linear decline
		step = last_remaining / max(1, remaining_days)
		return [max(0.0, last_remaining - step * (i + 1)) for i in range(remaining_days)]


def main() -> None:
	payload = read_input()

	# Expected input fields
	# total_points: total story points planned for the sprint
	# sprint_days: total number of days in the sprint
	# actuals: optional list of observed remaining points per day up to today
	total_points = float(payload.get("total_points", 0))
	sprint_days = int(payload.get("sprint_days", 0))
	actuals = payload.get("actuals", [])

	if sprint_days <= 0:
		print(json.dumps({"error": "sprint_days must be > 0"}))
		return

	ideal = generate_ideal_series(total_points, sprint_days)

	observed: List[float] = []
	if isinstance(actuals, list) and len(actuals) > 0:
		# Coerce to floats and clamp
		observed = [max(0.0, float(v)) for v in actuals][:sprint_days]
		# If observed longer than sprint_days, trim; if shorter, it's okay

	remaining_days = max(0, sprint_days - len(observed))
	forecast: List[float] = []
	if remaining_days > 0:
		last_rem = float(observed[-1]) if len(observed) > 0 else float(total_points)
		# Prefer saved model if present; otherwise use simple linear regression
		if _LOADED_MODEL is not None and os.environ.get('DISABLE_TS_MODEL', '0') != '1':
			forecast = prophet_like_forecast(remaining_days, last_rem)
		else:
			forecast = simple_forecast(observed, remaining_days)

	# Compose day-by-day output
	series: List[Dict[str, Any]] = []
	reached_zero = False
	for i in range(sprint_days):
		if reached_zero:
			break
			
		day_label = f"Day {i + 1}"
		ideal_val = float(ideal[i]) if i < len(ideal) else None
		actual_val = float(observed[i]) if i < len(observed) else None
		pred_val = None
		
		if i < len(observed):
			pred_val = float(observed[i])
		elif (i - len(observed)) < len(forecast):
			pred_val = float(forecast[i - len(observed)])
			
		# Check if prediction has reached zero
		if pred_val is not None and pred_val == 0:
			reached_zero = True
			
		series.append({
			"day": day_label,
			"ideal": round(ideal_val, 4) if ideal_val is not None else None,
			"actual": round(actual_val, 4) if actual_val is not None else None,
			"predicted": round(pred_val, 4) if pred_val is not None else None,
		})

	print(json.dumps({
		"series": series
	}))


if __name__ == "__main__":
	main()
