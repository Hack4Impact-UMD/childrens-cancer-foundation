import React from 'react';
import './Breadcrumbs.css';

interface BreadcrumbProps {
  currentPage: number;
  pages: string[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentPage, pages }) => {
  return (
    <div className="breadcrumbs-wrapper">
      <div className="breadcrumbs">
    {pages.map((currPage, key) => (
        <div className="breadcrumb-container" key={key}>
            <button className={currentPage === key + 1 ? 'breadcrumb-circle-active' : 'breadcrumb-circle'} />
            <p>{currPage}</p>
        </div>
    ))}
</div>
    </div>
  );
};

export default Breadcrumb;
