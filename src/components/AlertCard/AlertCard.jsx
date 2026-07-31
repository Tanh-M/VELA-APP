import { AlertTriangle, MapPin, Clock } from 'lucide-react';
import './AlertCard.css';

function AlertCard({ type, location, time, severity }) {
  return (
    <div className={`alert-card severity-${severity}`}>
      <div className="alert-card-icon">
        <AlertTriangle size={20} />
      </div>

      <div className="alert-card-body">
        <h4>{type}</h4>
        <div className="alert-card-meta">
          <span><MapPin size={13} /> {location}</span>
          <span><Clock size={13} /> {time}</span>
        </div>
      </div>

      <span className={`severity-badge severity-badge-${severity}`}>
        {severity}
      </span>
    </div>
  );
}

export default AlertCard;