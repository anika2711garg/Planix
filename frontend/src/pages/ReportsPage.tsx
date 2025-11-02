"use client";

import { useState, useEffect } from 'react';
import { Download, FileText, BarChart2, Star, CheckSquare, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../contexts/AuthContext';
// FIX: Import the 'UserOptions' type for strong typing.
import type { UserOptions } from 'jspdf-autotable';

const API_BASE = 'http://localhost:3000/api';

// Helper function to get auth token
const getToken = () => localStorage.getItem('auth_token');

// Types for API responses
interface Sprint {
  id: number;
  name: string;
  teamName: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  isActive: boolean;
}

interface ReportData {
  sprintName?: string;
  teamName?: string;
  startDate?: string;
  endDate?: string;
  goals?: string[];
  summary?: {
    completed: number;
    total: number;
    completionRate?: number;
  };
  taskBreakdown?: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
  };
  achievements?: string[];
  teamMembers?: string[];
  sprints?: any[];
  memberPerformance?: any[];
  riskAssessment?: {
    level: string;
    message: string;
  };
  recommendations?: string[];
}

// FIX: Re-add the custom interface to explicitly define the 'autoTable' method.
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

// --- MAIN PAGE COMPONENT ---
const ReportsPage = () => {
  const { user } = useAuth();
  
  // State for the report generation form
  const [reportType, setReportType] = useState('Sprint Summary');
  const [selectedSprint, setSelectedSprint] = useState('');
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('2025-10-01');
  const [endDate, setEndDate] = useState('2025-10-15');
  
  // State for API data
  const [loading, setLoading] = useState(false);
  const [availableSprints, setAvailableSprints] = useState<Sprint[]>([]);
  const [reportData, setReportData] = useState<ReportData>({
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
  });

  // Fetch available sprints on component mount
  useEffect(() => {
    // Check if user is logged in first
    const token = getToken();
    if (!token) {
      console.warn('⚠️ No authentication token found. Please login first.');
      // Still try to fetch with fallback data
    }
    fetchAvailableSprints();
  }, []);

  const fetchAvailableSprints = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/reports?type=available-sprints`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const sprints = await response.json();
        console.log('🔍 Fetched sprints:', sprints); // Debug log
        setAvailableSprints(sprints);
        
        // Set default selected sprint to the most recent active one
        const activeSprint = sprints.find((sprint: Sprint) => sprint.isActive) || sprints[0];
        if (activeSprint) {
          setSelectedSprint(`${activeSprint.name} (${activeSprint.isActive ? 'Current' : 'Completed'})`);
          setSelectedSprintId(activeSprint.id);
        }
      } else {
        console.error('❌ Failed to fetch sprints:', response.status, response.statusText);
        // Fallback: Add sample sprint data for testing
        const fallbackSprints = [
          {
            id: 1,
            name: 'Demo Current Sprint',
            teamName: 'Team',
            startDate: '2025-10-25',
            endDate: '2025-11-04',
            totalTasks: 4,
            completedTasks: 2,
            isActive: true
          },
          {
            id: 2,
            name: 'Integration Test Sprint',
            teamName: 'Team',
            startDate: '2025-11-01',
            endDate: '2025-11-15',
            totalTasks: 0,
            completedTasks: 0,
            isActive: true
          }
        ];
        setAvailableSprints(fallbackSprints);
        setSelectedSprint('Demo Current Sprint (Current)');
        setSelectedSprintId(1);
      }
    } catch (error) {
      console.error('Error fetching available sprints:', error);
      // Fallback data on network error
      const fallbackSprints = [
        {
          id: 1,
          name: 'Demo Current Sprint',
          teamName: 'Team',
          startDate: '2025-10-25',
          endDate: '2025-11-04',
          totalTasks: 4,
          completedTasks: 2,
          isActive: true
        }
      ];
      setAvailableSprints(fallbackSprints);
      setSelectedSprint('Demo Current Sprint (Current)');
      setSelectedSprintId(1);
    }
  };

  const fetchReportData = async () => {
    if (!selectedSprintId) return;
    
    setLoading(true);
    try {
      const token = getToken();
      let apiUrl = '';
      
      switch (reportType) {
        case 'Sprint Summary':
          apiUrl = `${API_BASE}/reports?type=sprint-summary&sprintId=${selectedSprintId}`;
          break;
        case 'Velocity Report':
          apiUrl = `${API_BASE}/reports?type=velocity&startDate=${startDate}&endDate=${endDate}`;
          break;
        case 'Team Performance':
          // Get team ID from selected sprint
          const selectedSprintData = availableSprints.find(s => s.id === selectedSprintId);
          if (selectedSprintData) {
            apiUrl = `${API_BASE}/reports?type=team-performance&teamId=1&startDate=${startDate}&endDate=${endDate}`;
          }
          break;
        case 'Burndown Analysis':
          apiUrl = `${API_BASE}/reports?type=burndown&sprintId=${selectedSprintId}`;
          break;
        default:
          return;
      }
      
      console.log('🔍 Fetching report data from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Report data received:', data);
        
        // Transform the data based on report type
        let transformedData = { ...data };
        
        if (reportType === 'Sprint Summary') {
          transformedData = {
            sprintName: data.sprintName || selectedSprint,
            teamName: data.teamName || 'Team',
            goals: data.goals || ['Complete planned tasks', 'Maintain quality', 'Meet deadlines'],
            summary: {
              completed: data.summary?.completed || 0,
              total: data.summary?.total || 0,
              completionRate: data.summary?.completionRate || 0
            },
            achievements: data.achievements || ['Sprint initiated successfully'],
            taskBreakdown: data.taskBreakdown || { total: 0, completed: 0, inProgress: 0, todo: 0 },
            teamMembers: data.teamMembers || []
          };
        }
        
        setReportData(transformedData);
      } else {
        console.error('Failed to fetch report data:', response.status);
        // Keep existing fallback data
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Keep existing fallback data
    } finally {
      setLoading(false);
    }
  };

  // Fetch report data when sprint or report type changes
  useEffect(() => {
    if (selectedSprintId) {
      fetchReportData();
    }
  }, [selectedSprintId, reportType, startDate, endDate]);

  // Debug function - can be called from console
  (window as any).debugReports = () => {
    console.log('🔍 Debug Info:');
    console.log('Available Sprints:', availableSprints);
    console.log('Selected Sprint:', selectedSprint);
    console.log('Selected Sprint ID:', selectedSprintId);
    console.log('Auth Token:', getToken());
    console.log('API Base:', API_BASE);
  };

  const handlePdfExport = () => {
    // FIX: Add the type cast back.
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const docTitle = `${reportData.sprintName || selectedSprint} ${reportType}`;

    doc.setFontSize(20);
    doc.text(docTitle, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30);
    
    if (reportData.teamName) {
      doc.text(`Team: ${reportData.teamName}`, 14, 38);
    }
    
    // Sprint Goals section
    if (reportData.goals && reportData.goals.length > 0) {
      doc.autoTable({
        startY: 50,
        head: [['Sprint Goals']],
        body: reportData.goals.map(goal => [goal]),
        theme: 'grid',
        headStyles: { fillColor: [78, 115, 223] },
      });
    }
    
    // Progress Summary section
    if (reportData.summary) {
      const summaryRows = [
        ['Completed Points', `${reportData.summary.completed} pts`],
        ['Total Points', `${reportData.summary.total} pts`],
      ];
      
      if (reportData.summary.completionRate) {
        summaryRows.push(['Completion Rate', `${reportData.summary.completionRate}%`]);
      }
      
      if (reportData.taskBreakdown) {
        summaryRows.push(
          ['Total Tasks', `${reportData.taskBreakdown.total}`],
          ['Completed Tasks', `${reportData.taskBreakdown.completed}`],
          ['In Progress Tasks', `${reportData.taskBreakdown.inProgress}`],
          ['Todo Tasks', `${reportData.taskBreakdown.todo}`]
        );
      }
      
      doc.autoTable({
        head: [['Progress Summary', 'Value']],
        body: summaryRows,
        theme: 'striped',
      });
    }

    // Key Achievements section
    if (reportData.achievements && reportData.achievements.length > 0) {
      doc.autoTable({
        head: [['Key Achievements']],
        body: reportData.achievements.map(ach => [ach]),
        theme: 'grid',
        headStyles: { fillColor: [28, 200, 138] },
      });
    }

    // Team Members section (if available)
    if (reportData.teamMembers && reportData.teamMembers.length > 0) {
      doc.autoTable({
        head: [['Team Members']],
        body: reportData.teamMembers.map(member => [member]),
        theme: 'grid',
        headStyles: { fillColor: [255, 165, 0] },
      });
    }

    // Report-specific sections
    if (reportType === 'Team Performance' && reportData.memberPerformance) {
      doc.autoTable({
        head: [['Member', 'Assigned Points', 'Completed Points', 'Completion Rate']],
        body: reportData.memberPerformance.slice(0, 10).map((member: any) => [
          member.username,
          member.totalAssigned.toString(),
          member.totalCompleted.toString(),
          `${member.completionRate}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [67, 56, 202] },
      });
    }

    if (reportType === 'Velocity Report' && reportData.sprints) {
      doc.autoTable({
        head: [['Sprint', 'Points Completed', 'Tasks Completed']],
        body: reportData.sprints.slice(-5).map((sprint: any) => [
          sprint.sprintName,
          sprint.points.toString(),
          sprint.tasksCompleted.toString()
        ]),
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
      });
    }

    if (reportType === 'Burndown Analysis' && reportData.riskAssessment) {
      doc.autoTable({
        head: [['Risk Assessment']],
        body: [
          [`Risk Level: ${reportData.riskAssessment.level}`],
          [reportData.riskAssessment.message]
        ],
        theme: 'grid',
        headStyles: { 
          fillColor: reportData.riskAssessment.level === 'High' ? [239, 68, 68] : 
                     reportData.riskAssessment.level === 'Medium' ? [245, 158, 11] : [34, 197, 94]
        },
      });

      if (reportData.recommendations) {
        doc.autoTable({
          head: [['Recommendations']],
          body: reportData.recommendations.map((rec: string) => [rec]),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
        });
      }
    }

    doc.save(`${docTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleCsvExport = () => {
    const headers = ['Category', 'Details'];
    const rows = [
      ['Report Title', `${reportData.sprintName || selectedSprint} ${reportType}`],
      ['Date Range', `${startDate} to ${endDate}`],
      ...(reportData.teamName ? [['Team', reportData.teamName]] : []),
      ...(reportData.goals && reportData.goals.length > 0 ? [['Sprint Goals', `"${reportData.goals.join(', ')}"`]] : []),
      ...(reportData.summary ? [
        ['Completed Points', reportData.summary.completed.toString()],
        ['Total Points', reportData.summary.total.toString()],
        ...(reportData.summary.completionRate ? [['Completion Rate', `${reportData.summary.completionRate}%`]] : [])
      ] : []),
      ...(reportData.achievements && reportData.achievements.length > 0 ? [['Key Achievements', `"${reportData.achievements.join(', ')}"`]] : []),
      ...(reportData.teamMembers && reportData.teamMembers.length > 0 ? [['Team Members', `"${reportData.teamMembers.join(', ')}"`]] : [])
    ];

    // Add report-specific data
    if (reportType === 'Team Performance' && reportData.memberPerformance) {
      rows.push(['', '']); // Empty row separator
      rows.push(['Member Performance', '']);
      reportData.memberPerformance.forEach((member: any) => {
        rows.push([member.username, `${member.totalCompleted}/${member.totalAssigned} points (${member.completionRate}%)`]);
      });
    }

    if (reportType === 'Velocity Report' && reportData.sprints) {
      rows.push(['', '']); // Empty row separator
      rows.push(['Sprint Velocity', '']);
      reportData.sprints.forEach((sprint: any) => {
        rows.push([sprint.sprintName, `${sprint.points} points, ${sprint.tasksCompleted} tasks`]);
      });
    }

    if (reportType === 'Burndown Analysis') {
      if (reportData.riskAssessment) {
        rows.push(['', '']); // Empty row separator
        rows.push(['Risk Assessment', `${reportData.riskAssessment.level}: ${reportData.riskAssessment.message}`]);
      }
      
      if (reportData.recommendations) {
        rows.push(['Recommendations', `"${reportData.recommendations.join('; ')}"`]);
      }
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(reportData.sprintName || selectedSprint).replace(/ /g, '_')}_${reportType.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSprintChange = (sprintName: string) => {
    setSelectedSprint(sprintName);
    const sprint = availableSprints.find(s => 
      `${s.name} (${s.isActive ? 'Current' : 'Completed'})` === sprintName
    );
    if (sprint) {
      setSelectedSprintId(sprint.id);
    }
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
                <select 
                  id="sprint" 
                  value={selectedSprint} 
                  onChange={(e) => handleSprintChange(e.target.value)} 
                  className="w-full pl-4 pr-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableSprints.map(sprint => (
                    <option key={sprint.id} value={`${sprint.name} (${sprint.isActive ? 'Current' : 'Completed'})`}>
                      {sprint.name} ({sprint.isActive ? 'Current' : 'Completed'}) - {sprint.teamName}
                    </option>
                  ))}
                  {availableSprints.length === 0 && (
                    <option value="">No sprints available</option>
                  )}
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
             
              <button onClick={handleCsvExport} className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-600 text-white font-bold px-5 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <Download size={20} />
                Export as CSV
              </button>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default ReportsPage;