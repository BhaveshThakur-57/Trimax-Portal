import React from 'react';
import { Layers, Edit, Plus, FileText } from 'lucide-react';
import Button from '../common/Button';

const ContentManagement = () => {
  const contentSections = [
    { 
      id: 1, 
      title: 'Homepage Content', 
      description: 'Manage homepage hero, features, and testimonials',
      icon: FileText,
      color: 'blue'
    },
    { 
      id: 2, 
      title: 'About Us Page', 
      description: 'Company information and team details',
      icon: FileText,
      color: 'green'
    },
    { 
      id: 3, 
      title: 'Services Page', 
      description: 'Service descriptions and pricing',
      icon: FileText,
      color: 'purple'
    },
    { 
      id: 4, 
      title: 'Contact Page', 
      description: 'Contact form and company contact info',
      icon: FileText,
      color: 'orange'
    },
    { 
      id: 5, 
      title: 'Blog Posts', 
      description: 'Create and manage blog articles',
      icon: Plus,
      color: 'red'
    },
    { 
      id: 6, 
      title: 'FAQs', 
      description: 'Frequently asked questions',
      icon: FileText,
      color: 'teal'
    }
  ];

  const handleEdit = (sectionId) => {
    console.log('Edit section:', sectionId);
  };

  return (
    <div className="page-content">
      <div className="page-header-modern">
        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Layers size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              Content Management
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              Manage website content and pages
            </p>
          </div>
        </div>
      </div>

      <div className="content-grid-modern">
        {contentSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <div key={section.id} className="content-card-modern">
              <div className={`content-icon-modern ${section.color}`}>
                <IconComponent size={24} />
              </div>
              <h3>{section.title}</h3>
              <p className="content-description-modern">{section.description}</p>
              <Button 
                variant="secondary" 
                icon={<Edit size={16} />}
                onClick={() => handleEdit(section.id)}
                fullWidth
              >
                {section.id === 5 ? 'New Post' : 'Edit Content'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContentManagement;