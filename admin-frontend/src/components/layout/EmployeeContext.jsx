import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const EmployeeDataContext = React.createContext();

export const EmployeeDataProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Profile Picture State
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attendance State
  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    const saved = localStorage.getItem(`attendance_${user?.employeeId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Leave State
  const [leaveApplications, setLeaveApplications] = useState(() => {
    const saved = localStorage.getItem(`leaves_${user?.employeeId}`);
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        type: 'Casual Leave', 
        startDate: '2026-02-15', 
        endDate: '2026-02-16', 
        days: 2, 
        reason: 'Personal work', 
        status: 'Approved', 
        appliedOn: '2026-02-10' 
      },
      { 
        id: 2, 
        type: 'Sick Leave', 
        startDate: '2026-01-20', 
        endDate: '2026-01-21', 
        days: 2, 
        reason: 'Fever', 
        status: 'Approved', 
        appliedOn: '2026-01-20' 
      }
    ];
  });

  // Leave Balance State
  const [leaveBalance, setLeaveBalance] = useState(() => {
    const saved = localStorage.getItem(`leaveBalance_${user?.employeeId}`);
    return saved ? JSON.parse(saved) : {
      casual: { used: 3, total: 10 },
      sick: { used: 2, total: 10 },
      earned: { used: 0, total: 15 }
    };
  });

  // ⭐⭐⭐ LOAD PROFILE PICTURE FROM BACKEND ⭐⭐⭐
  useEffect(() => {
    const loadProfilePicture = async () => {
      if (!user?.employeeId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.success && data.data.profilePicture) {
          setProfilePicture(data.data.profilePicture);
          localStorage.setItem(`profilePic_${user.employeeId}`, data.data.profilePicture);
        } else {
          const localPic = localStorage.getItem(`profilePic_${user.employeeId}`);
          if (localPic) {
            setProfilePicture(localPic);
          }
        }
      } catch (error) {
        console.error('Error loading profile picture:', error);
        const localPic = localStorage.getItem(`profilePic_${user.employeeId}`);
        if (localPic) {
          setProfilePicture(localPic);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfilePicture();
  }, [user?.employeeId]);

  // Save to localStorage
  useEffect(() => {
    if (user?.employeeId) {
      localStorage.setItem(`attendance_${user.employeeId}`, JSON.stringify(attendanceRecords));
    }
  }, [attendanceRecords, user]);

  useEffect(() => {
    if (user?.employeeId) {
      localStorage.setItem(`leaves_${user.employeeId}`, JSON.stringify(leaveApplications));
    }
  }, [leaveApplications, user]);

  useEffect(() => {
    if (user?.employeeId) {
      localStorage.setItem(`leaveBalance_${user.employeeId}`, JSON.stringify(leaveBalance));
    }
  }, [leaveBalance, user]);

  return (
    <EmployeeDataContext.Provider value={{
      profilePicture,
      setProfilePicture,
      loading,
      attendanceRecords,
      setAttendanceRecords,
      leaveApplications,
      setLeaveApplications,
      leaveBalance,
      setLeaveBalance
    }}>
      {children}
    </EmployeeDataContext.Provider>
  );
};

export const useEmployeeContext = () => {
  const context = React.useContext(EmployeeDataContext);
  if (!context) {
    throw new Error('useEmployeeContext must be used within EmployeeDataProvider');
  }
  return context;
};