import { useState } from 'react';

const ProfileAvatar = ({ src, name, size = 40, className = '', style = {} }) => {
  const [failed, setFailed] = useState(false);
  const avatarStyle = {
    width: size,
    height: size,
    flex: '0 0 auto',
    borderRadius: '50%',
    objectFit: 'cover',
    ...style,
  };

  if (src && !failed) {
    return <img className={className} src={src} alt={`${name || 'User'} profile`} style={avatarStyle} onError={() => setFailed(true)} />;
  }

  return (
    <span className={`db-avatar-fallback ${className}`.trim()} role="img" aria-label={`${name || 'User'} profile initials`} style={{ ...avatarStyle, display: 'inline-flex' }}>
      {name?.trim()?.slice(0, 1).toUpperCase() || '?'}
    </span>
  );
};

export default ProfileAvatar;
