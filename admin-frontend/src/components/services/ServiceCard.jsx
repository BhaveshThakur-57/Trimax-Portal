import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import Badge from '../common/Badge';

const ServiceCard = ({ service, onEdit, onDelete }) => {
  return (
    <div className="service-card-modern">
      <div className="service-card-header">
        <h3>{service.name}</h3>
        <Badge status={service.status}>{service.status}</Badge>
      </div>
      
      <p className="service-description-modern">{service.description}</p>
      
      {service.features && service.features.length > 0 && (
        <div className="service-tech-stack">
          {service.features.map((feature, index) => (
            <span key={index} className="tech-tag">{feature}</span>
          ))}
        </div>
      )}
      
      <div className="service-footer">
        <p className="service-price-modern">{service.price}</p>
        <div className="service-actions-modern">
          <button 
            className="action-btn-icon edit"
            onClick={() => onEdit(service)}
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button 
            className="action-btn-icon delete"
            onClick={() => onDelete(service._id)}
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;