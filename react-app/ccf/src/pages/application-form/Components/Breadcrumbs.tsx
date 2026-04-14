import React from 'react';
import './Breadcrumbs.css';

interface BreadcrumbProps {
  currentPage: number;
  pages: string[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentPage, pages }) => {
  const connectorInset = `${50 / pages.length}%`;

  return (
    <div className="breadcrumbs-wrapper">
      <div
        className="breadcrumbs"
        style={{ ["--breadcrumb-connector-inset" as any]: connectorInset }}
      >
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
