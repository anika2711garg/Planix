"use client";

import { useState } from 'react';
import { Download, FileText, BarChart2, Star, CheckSquare } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
// FIX: Import the 'UserOptions' type for strong typing.
import type { UserOptions } from 'jspdf-autotable';

// FIX: Re-add the custom interface to explicitly define the 'autoTable' method.
// This tells TypeScript that the method exists and what its parameters are.
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

// --- MAIN PAGE COMPONENT ---
const ReportsPage = () => {
  // State for the report generation form
  const [reportType, setReportType] = useState('Sprint Summary');
  const [selectedSprint, setSelectedSprint] = useState('Sprint 24 (Current)');
  const [startDate, setStartDate] = useState('2025-10-01');
  const [endDate, setEndDate] = useState('2025-10-15');

  // Mock data for the report content
  const reportData = {
    goals: [
      'Complete user authentication system',
      'Implement dashboard analytics',
      'Deploy payment integration',
    ],
    summary: {
      completed: 52,
      total: 80,
    },
    achievements: [
      'Successfully integrated OAuth2 authentication',
      'Deployed real-time notification system',
      'Completed 15 tasks ahead of schedule',
    ],
  };

  const handlePdfExport = () => {
    // FIX: Add the type cast back.
    // This tells TypeScript to treat the 'doc' object as our extended type,
    // which includes the 'autoTable' method.
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const docTitle = `${selectedSprint} ${reportType}`;

    doc.setFontSize(20);
    doc.text(docTitle, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30);
    
    // The 'autoTable' calls will now pass type-checking.
    doc.autoTable({
      startY: 40,
      head: [['Sprint Goals']],
      body: reportData.goals.map(goal => [goal]),
      theme: 'grid',
      headStyles: { fillColor: [78, 115, 223] },
    });
    
    doc.autoTable({
      head: [['Progress Summary', 'Value']],
      body: [
        ['Completed Points', `${reportData.summary.completed} pts`],
        ['Total Points', `${reportData.summary.total} pts`],
      ],
      theme: 'striped',
    });

    doc.autoTable({
      head: [['Key Achievements']],
      body: reportData.achievements.map(ach => [ach]),
      theme: 'grid',
      headStyles: { fillColor: [28, 200, 138] },
    });

    doc.save(`${docTitle.replace(/ /g, '_')}.pdf`);
  };

  const handleCsvExport = () => {
    const headers = ['Category', 'Details'];
    const rows = [
      ['Report Title', `${selectedSprint} ${reportType}`],
      ['Date Range', `${startDate} to ${endDate}`],
      ['Sprint Goals', `"${reportData.goals.join(', ')}"`],
      ['Completed Points', reportData.summary.completed],
      ['Total Points', reportData.summary.total],
      ['Key Achievements', `"${reportData.achievements.join(', ')}"`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedSprint.replace(/ /g, '_')}_${reportType.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-slate-900 p-4 sm:p-6 md:p-8 text-white">
      {/* Animated Aurora Background */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-1">Reports & Insights</h1>
          <p className="text-indigo-300">Generate and export detailed sprint reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Side: Report Generation Form */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-200 mb-6">Generate Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="reportType" className="block text-sm font-medium text-gray-300 mb-2">Report Type</label>
                <select id="reportType" value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full pl-4 pr-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Sprint Summary</option>
                  <option>Velocity Report</option>
                  <option>Team Performance</option>
                  <option>Burndown Analysis</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="sprint" className="block text-sm font-medium text-gray-300 mb-2">Select Sprint</label>
                <select id="sprint" value={selectedSprint} onChange={(e) => setSelectedSprint(e.target.value)} className="w-full pl-4 pr-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Sprint 24 (Current)</option>
                  <option>Sprint 23</option>
                  <option>Sprint 22</option>
                  <option>Sprint 21</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={handlePdfExport} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-5 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <Download size={20} />
                Export as PDF
              </button>
              <button onClick={handleCsvExport} className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-600 text-white font-bold px-5 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <Download size={20} />
                Export as CSV
              </button>
            </div>
          </div>

          {/* Right Side: Report Preview */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-200 mb-6">Live Preview</h3>
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 min-h-[400px]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <FileText className="text-white" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{`${selectedSprint} ${reportType}`}</h4>
                  <p className="text-sm text-gray-400">{`For period: ${startDate} to ${endDate}`}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h5 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                    <CheckSquare size={16} className="text-indigo-400" />
                    Sprint Goals
                  </h5>
                  <ul className="list-inside text-sm text-gray-400 space-y-2 pl-2">
                    {reportData.goals.map((goal, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-indigo-400 mt-1">&bull;</span> {goal}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="border-b border-white/10 pb-4">
                   <h5 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                     <BarChart2 size={16} className="text-indigo-400" />
                     Progress Summary
                   </h5>
                   <div className="grid grid-cols-2 gap-4 pl-2">
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-xs text-gray-400">Completed</p>
                        <p className="text-3xl font-bold text-green-400">{reportData.summary.completed} <span className="text-lg">pts</span></p>
                      </div>
                       <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="text-3xl font-bold text-white">{reportData.summary.total} <span className="text-lg">pts</span></p>
                      </div>
                   </div>
                </div>
                
                <div>
                   <h5 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                    <Star size={16} className="text-indigo-400" />
                    Key Achievements
                  </h5>
                  <ul className="list-inside text-sm text-gray-400 space-y-2 pl-2">
                     {reportData.achievements.map((ach, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-indigo-400 mt-1">&bull;</span> {ach}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;