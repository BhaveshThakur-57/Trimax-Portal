export const mockStats = {
  totalUsers: 1234,
  activeInquiries: 45,
  totalServices: 12,
  monthlyRevenue: '$45,600',
  usersChange: '+12%',
  inquiriesChange: '+8%',
  servicesChange: '0%',
  revenueChange: '+18%'
};

export const mockUsers = [
  { 
    id: 1, 
    name: 'John Doe', 
    email: 'john@example.com', 
    role: 'Admin', 
    status: 'Active', 
    joinDate: '2024-01-15' 
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    email: 'jane@example.com', 
    role: 'User', 
    status: 'Active', 
    joinDate: '2024-02-20' 
  },
  { 
    id: 3, 
    name: 'Bob Johnson', 
    email: 'bob@example.com', 
    role: 'User', 
    status: 'Inactive', 
    joinDate: '2024-03-10' 
  },
  { 
    id: 4, 
    name: 'Alice Williams', 
    email: 'alice@example.com', 
    role: 'User', 
    status: 'Active', 
    joinDate: '2024-04-05' 
  },
  { 
    id: 5, 
    name: 'Charlie Brown', 
    email: 'charlie@example.com', 
    role: 'User', 
    status: 'Active', 
    joinDate: '2024-05-12' 
  }
];

export const mockInquiries = [
  { 
    id: 1, 
    name: 'Sarah Chen', 
    email: 'sarah@company.com', 
    subject: 'Web Development Quote', 
    message: 'Looking for a custom web application for our business.',
    date: '2024-12-15', 
    status: 'New' 
  },
  { 
    id: 2, 
    name: 'Mike Brown', 
    email: 'mike@startup.io', 
    subject: 'Cloud Migration Services', 
    message: 'Need help migrating our infrastructure to AWS.',
    date: '2024-12-14', 
    status: 'In Progress' 
  },
  { 
    id: 3, 
    name: 'Emma Davis', 
    email: 'emma@tech.com', 
    subject: 'Mobile App Development', 
    message: 'Interested in developing a mobile app for iOS and Android.',
    date: '2024-12-13', 
    status: 'Completed' 
  },
  { 
    id: 4, 
    name: 'David Wilson', 
    email: 'david@agency.com', 
    subject: 'UI/UX Design Services', 
    message: 'Looking for design services for our new product.',
    date: '2024-12-12', 
    status: 'New' 
  }
];

export const mockServices = [
  { 
    id: 1, 
    name: 'Web Development', 
    description: 'Custom web applications built with modern technologies', 
    price: '$5,000', 
    status: 'Active',
    features: ['React', 'Node.js', 'PostgreSQL']
  },
  { 
    id: 2, 
    name: 'Mobile App Development', 
    description: 'Native iOS and Android applications', 
    price: '$8,000', 
    status: 'Active',
    features: ['React Native', 'Swift', 'Kotlin']
  },
  { 
    id: 3, 
    name: 'Cloud Solutions', 
    description: 'AWS, Azure, and GCP cloud infrastructure', 
    price: '$3,000', 
    status: 'Active',
    features: ['AWS', 'Azure', 'GCP']
  },
  { 
    id: 4, 
    name: 'UI/UX Design', 
    description: 'User interface and experience design', 
    price: '$2,500', 
    status: 'Active',
    features: ['Figma', 'Adobe XD', 'Prototyping']
  },
  { 
    id: 5, 
    name: 'SEO Optimization', 
    description: 'Search engine optimization services', 
    price: '$1,500', 
    status: 'Inactive',
    features: ['On-page SEO', 'Analytics', 'Reporting']
  }
];

export const mockActivities = [
  {
    id: 1,
    type: 'user',
    message: 'New user registered: John Doe',
    time: '2 hours ago',
    color: 'blue'
  },
  {
    id: 2,
    type: 'inquiry',
    message: 'New inquiry received from Sarah Chen',
    time: '4 hours ago',
    color: 'green'
  },
  {
    id: 3,
    type: 'service',
    message: 'Service updated: Web Development',
    time: '1 day ago',
    color: 'orange'
  },
  {
    id: 4,
    type: 'user',
    message: 'User deleted: Test Account',
    time: '2 days ago',
    color: 'red'
  }
];

export const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'users', label: 'User Management', icon: 'Users' },
  { id: 'inquiries', label: 'Inquiries', icon: 'MessageSquare' },
  { id: 'services', label: 'Services', icon: 'Briefcase' },
  { id: 'content', label: 'Content Management', icon: 'FileText' },
  { id: 'settings', label: 'Settings', icon: 'Settings' }
];

// ... existing code ...

export const mockTopProducts = [
  { id: 1, name: 'Web Development', popularity: 85, sales: '48%' },
  { id: 2, name: 'Mobile App Development', popularity: 72, sales: '35%' },
  { id: 3, name: 'Cloud Solutions', popularity: 65, sales: '28%' },
  { id: 4, name: 'UI/UX Design', popularity: 58, sales: '22%' },
  { id: 5, name: 'SEO Optimization', popularity: 45, sales: '15%' }
];

// ... existing code ...

export const mockEmployees = [
  { 
    id: 1, 
    name: 'Rahul Sharma', 
    email: 'rahul.sharma@trimax.com', 
    designation: 'Senior Developer',
    department: 'Engineering',
    phone: '+91 98765 43210',
    status: 'Active', 
    joinDate: '2023-01-15',
    salary: '₹85,000',
    reportingTo: 'Tech Lead'
  },
  { 
    id: 2, 
    name: 'Priya Patel', 
    email: 'priya.patel@trimax.com', 
    designation: 'UI/UX Designer',
    department: 'Design',
    phone: '+91 98765 43211',
    status: 'Active', 
    joinDate: '2023-03-20',
    salary: '₹65,000',
    reportingTo: 'Design Head'
  },
  { 
    id: 3, 
    name: 'Amit Kumar', 
    email: 'amit.kumar@trimax.com', 
    designation: 'Project Manager',
    department: 'Management',
    phone: '+91 98765 43212',
    status: 'Active', 
    joinDate: '2022-11-10',
    salary: '₹95,000',
    reportingTo: 'Director'
  },
  { 
    id: 4, 
    name: 'Sneha Gupta', 
    email: 'sneha.gupta@trimax.com', 
    designation: 'Marketing Executive',
    department: 'Marketing',
    phone: '+91 98765 43213',
    status: 'Active', 
    joinDate: '2023-05-12',
    salary: '₹55,000',
    reportingTo: 'Marketing Manager'
  },
  { 
    id: 5, 
    name: 'Vikram Singh', 
    email: 'vikram.singh@trimax.com', 
    designation: 'DevOps Engineer',
    department: 'Engineering',
    phone: '+91 98765 43214',
    status: 'On Leave', 
    joinDate: '2023-02-18',
    salary: '₹78,000',
    reportingTo: 'Tech Lead'
  }
];

export const departments = [
  'All Departments',
  'Engineering',
  'Design',
  'Management',
  'Marketing',
  'Sales',
  'HR',
  'Finance'
];