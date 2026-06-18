import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useEmployeeContext } from './EmployeeContext';
import { Layers, 
  User, Camera, Upload, Trash2, Edit, Save, Settings, 
  Briefcase, AlertCircle 
} from 'lucide-react';

const MyProfile = () => {
  const { user } = useAuth();
  const { profilePicture, setProfilePicture, loading } = useEmployeeContext();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    designation: '',
    phone: '',
    dateOfBirth: '',
    dateOfJoining: '',
    address: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // ⭐ Page load pe backend se fresh data fetch karo
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          const u = data.data;
          setProfileData({
            name:          u.name          || '',
            email:         u.email         || '',
            employeeId:    u.employeeId    || '',
            department:    u.department    || '',
            designation:   u.designation   || '',
            phone:         u.phone         || '',
            dateOfBirth:   u.dateOfBirth   ? u.dateOfBirth.split('T')[0]   : '',
            dateOfJoining: u.joiningDate   ? u.joiningDate.split('T')[0]   : '',
            address:       u.address       || '',
            emergencyContact: {
              name:         u.emergencyContact?.name         || '',
              relationship: u.emergencyContact?.relationship || '',
              phone:        u.emergencyContact?.phone        || ''
            }
          });

          // Profile picture bhi sync karo
          if (u.profilePicture) {
            setProfilePicture(u.profilePicture);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // sirf ek baar chalega

  // ⭐ Profile picture upload
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB!');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file!');
        return;
      }

      setUploading(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5000/api/auth/upload-profile-picture', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ profilePicture: base64Image })
          });

          const data = await response.json();

          if (data.success) {
            setProfilePicture(base64Image);
            localStorage.setItem(`profilePic_${user?.employeeId}`, base64Image);
            alert('✅ Profile picture updated successfully!');
          } else {
            alert('❌ ' + (data.message || 'Failed to update profile picture'));
          }
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          alert('❌ Failed to upload profile picture. Please try again.');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ⭐ Profile picture remove
  const handleRemoveProfilePicture = async () => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      setUploading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/auth/remove-profile-picture', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
          setProfilePicture(null);
          localStorage.removeItem(`profilePic_${user?.employeeId}`);
          alert('✅ Profile picture removed successfully!');
        } else {
          alert('❌ ' + (data.message || 'Failed to remove profile picture'));
        }
      } catch (error) {
        console.error('Error removing profile picture:', error);
        alert('❌ Failed to remove profile picture. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  // ⭐ Profile save - backend call + local state update
  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name:             profileData.name,
          phone:            profileData.phone,
          dateOfBirth:      profileData.dateOfBirth,
          address:          profileData.address,
          emergencyContact: profileData.emergencyContact
        })
      });

      const data = await response.json();

      if (data.success) {
        // ⭐ Backend se aaya hua fresh data state mein set karo
        const u = data.data;
        setProfileData({
          name:          u.name          || '',
          email:         u.email         || '',
          employeeId:    u.employeeId    || '',
          department:    u.department    || '',
          designation:   u.designation   || '',
          phone:         u.phone         || '',
          dateOfBirth:   u.dateOfBirth   ? u.dateOfBirth.split('T')[0]   : '',
          dateOfJoining: u.joiningDate   ? u.joiningDate.split('T')[0]   : '',
          address:       u.address       || '',
          emergencyContact: {
            name:         u.emergencyContact?.name         || '',
            relationship: u.emergencyContact?.relationship || '',
            phone:        u.emergencyContact?.phone        || ''
          }
        });
        setIsEditing(false);
        alert('Profile updated successfully! ✅');
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('❌ Network error. Please try again.');
    }
  };

  // ⭐ Change password - backend call
  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      alert('Please fill all password fields!');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match!');
      return;
    }
    if (passwords.new.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword:     passwords.new
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Password changed successfully! ✅');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      alert('❌ Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Layers size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              My Profile
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              Manage your personal information
            </p>
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Edit size={18} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleSaveProfile}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Save size={18} />
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Profile Picture Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex flex-col md:flex-row items-center gap-5 sm:gap-6">
          <div className="relative group shrink-0">
            {uploading ? (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gray-200 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-blue-100"
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-brand-500 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold border-4 border-blue-100">
                {(profileData.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            
            {!uploading && (
              <div
                className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="text-white" size={32} />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left w-full">
            <h2 className="text-xl sm:text-[24px] font-bold font-display text-gray-800">{profileData.name || '—'}</h2>
            <p className="text-gray-600">{profileData.designation || '—'}</p>
            <p className="text-sm text-gray-500 mt-1">Employee ID: {profileData.employeeId}</p>
            
            <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
              
              {profilePicture && (
                <button
                  onClick={handleRemoveProfilePicture}
                  disabled={uploading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                  {uploading ? 'Removing...' : 'Remove Photo'}
                </button>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">Allowed: JPG, PNG, GIF (Max 5MB)</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureChange}
            className="hidden"
            disabled={uploading}
          />
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
          <User size={20} className="text-blue-600 shrink-0" />
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              value={profileData.dateOfBirth}
              onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={profileData.address}
              onChange={(e) => setProfileData({...profileData, address: e.target.value})}
              disabled={!isEditing}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Work Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
          <Briefcase size={20} className="text-brand-600 shrink-0" />
          Work Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <input
              type="text"
              value={profileData.department}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
            <input
              type="text"
              value={profileData.designation}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Joining</label>
            <input
              type="date"
              value={profileData.dateOfJoining}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
            <input
              type="text"
              value={profileData.employeeId}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
          <AlertCircle size={20} className="text-orange-600 shrink-0" />
          Emergency Contact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
            <input
              type="text"
              value={profileData.emergencyContact.name}
              onChange={(e) => setProfileData({
                ...profileData,
                emergencyContact: {...profileData.emergencyContact, name: e.target.value}
              })}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
            <input
              type="text"
              value={profileData.emergencyContact.relationship}
              onChange={(e) => setProfileData({
                ...profileData,
                emergencyContact: {...profileData.emergencyContact, relationship: e.target.value}
              })}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={profileData.emergencyContact.phone}
              onChange={(e) => setProfileData({
                ...profileData,
                emergencyContact: {...profileData.emergencyContact, phone: e.target.value}
              })}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
          <Settings size={20} className="text-gray-600 shrink-0" />
          Change Password
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({...passwords, current: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({...passwords, new: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleChangePassword}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;