import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ title, description }) => {
  useEffect(() => {
    document.title = `${title} | IntellMeet`;
    
    // Manage description meta tag
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    
    metaDescription.setAttribute(
      'content',
      description || 'IntellMeet: Next-Generation AI-Powered Enterprise Meeting & Collaboration Platform'
    );
  }, [title, description]);

  return null;
};

export default SEOHead;
