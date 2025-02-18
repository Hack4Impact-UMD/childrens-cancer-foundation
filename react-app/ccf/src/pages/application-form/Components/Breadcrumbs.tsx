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
    {/*<div className="breadcrumb-line"></div>*/}
    {pages.map((currPage, key) => (
        <div className="breadcrumb-container">
            <button key={key} className={currentPage === key + 1 ? 'breadcrumb-circle-active' : 'breadcrumb-circle'} />
            <p>{currPage}</p>
        </div>
    ))}
</div>
    </div>
  );
};

export default Breadcrumb;
