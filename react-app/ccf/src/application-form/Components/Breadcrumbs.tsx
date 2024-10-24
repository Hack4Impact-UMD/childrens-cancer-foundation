import React from 'react';
import './Breadcrumbs.css';

interface BreadcrumbProps {
  currentPage: number;
  pages: string[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentPage, pages }) => {
  return (
    <div>
      {/* Display the names of each page */}
      <div className="breadcrumbs">
        {pages.map((currPage) => (
          <p>{currPage}</p>
        ))}
      </div>
    </div>
  );
};

export default Breadcrumb;
