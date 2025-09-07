import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar/Sidebar';
import { getSidebarbyRole } from '../../types/sidebar-types';
import { 
  getMigrationStatus, 
  createDefaultFormTemplates, 
  migrateExistingApplications,
  runCompleteMigration 
} from '../../backend/migration-service';
import { toast } from 'react-toastify';
import './MigrationPage.css';
import { FaDatabase, FaCheck, FaExclamationTriangle, FaPlay, FaSync } from 'react-icons/fa';

interface MigrationStatus {
  totalApplications: number;
  migratedApplications: number;
  legacyApplications: number;
  templatesCreated: boolean;
}

const MigrationPage: React.FC = () => {
  const sidebarItems = getSidebarbyRole('admin');
  
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [creatingTemplates, setCreatingTemplates] = useState(false);

  useEffect(() => {
    loadMigrationStatus();
  }, []);

  const loadMigrationStatus = async () => {
    try {
      setLoading(true);
      const migrationStatus = await getMigrationStatus();
      setStatus(migrationStatus);
    } catch (error) {
      console.error('Error loading migration status:', error);
      toast.error('Failed to load migration status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplates = async () => {
    if (!window.confirm('This will create default form templates. Are you sure you want to continue?')) {
      return;
    }

    setCreatingTemplates(true);
    try {
      await createDefaultFormTemplates();
      toast.success('Default form templates created successfully!');
      await loadMigrationStatus();
    } catch (error) {
      console.error('Error creating templates:', error);
      toast.error('Failed to create form templates');
    } finally {
      setCreatingTemplates(false);
    }
  };

  const handleMigrateApplications = async () => {
    if (!window.confirm('This will migrate all existing applications to the new format. This process may take several minutes. Are you sure you want to continue?')) {
      return;
    }

    setMigrating(true);
    try {
      await migrateExistingApplications();
      toast.success('Applications migrated successfully!');
      await loadMigrationStatus();
    } catch (error) {
      console.error('Error migrating applications:', error);
      toast.error('Failed to migrate applications');
    } finally {
      setMigrating(false);
    }
  };

  const handleRunCompleteMigration = async () => {
    if (!window.confirm('This will run the complete migration process (create templates and migrate applications). This process may take several minutes and cannot be undone. Are you sure you want to continue?')) {
      return;
    }

    setMigrating(true);
    setCreatingTemplates(true);
    try {
      await runCompleteMigration();
      toast.success('Complete migration finished successfully!');
      await loadMigrationStatus();
    } catch (error) {
      console.error('Error during complete migration:', error);
      toast.error('Migration process failed');
    } finally {
      setMigrating(false);
      setCreatingTemplates(false);
    }
  };

  const getMigrationProgress = () => {
    if (!status) return 0;
    if (status.totalApplications === 0) return 100;
    return Math.round((status.migratedApplications / status.totalApplications) * 100);
  };

  const isReadyForMigration = () => {
    return status?.templatesCreated && status?.legacyApplications > 0;
  };

  const isMigrationComplete = () => {
    return status?.templatesCreated && status?.legacyApplications === 0;
  };

  if (loading) {
    return (
      <div className="migration-page">
        <Sidebar links={sidebarItems} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading migration status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="migration-page">
      <Sidebar links={sidebarItems} />
      <div className="main-content">
        <div className="page-header">
          <div className="header-content">
            <h1>System Migration</h1>
            <p>Migrate from legacy application system to dynamic forms</p>
          </div>
          <button 
            onClick={loadMigrationStatus}
            className="refresh-btn"
            disabled={loading}
          >
            <FaSync /> Refresh Status
          </button>
        </div>

        {status && (
          <>
            <div className="migration-status">
              <div className="status-overview">
                <h2>Migration Overview</h2>
                
                <div className="status-cards">
                  <div className="status-card">
                    <div className="card-icon">
                      <FaDatabase />
                    </div>
                    <div className="card-content">
                      <div className="card-number">{status.totalApplications}</div>
                      <div className="card-label">Total Applications</div>
                    </div>
                  </div>

                  <div className="status-card">
                    <div className="card-icon success">
                      <FaCheck />
                    </div>
                    <div className="card-content">
                      <div className="card-number">{status.migratedApplications}</div>
                      <div className="card-label">Migrated Applications</div>
                    </div>
                  </div>

                  <div className="status-card">
                    <div className="card-icon warning">
                      <FaExclamationTriangle />
                    </div>
                    <div className="card-content">
                      <div className="card-number">{status.legacyApplications}</div>
                      <div className="card-label">Legacy Applications</div>
                    </div>
                  </div>

                  <div className="status-card">
                    <div className={`card-icon ${status.templatesCreated ? 'success' : 'warning'}`}>
                      {status.templatesCreated ? <FaCheck /> : <FaExclamationTriangle />}
                    </div>
                    <div className="card-content">
                      <div className="card-number">{status.templatesCreated ? 'Yes' : 'No'}</div>
                      <div className="card-label">Templates Created</div>
                    </div>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-header">
                    <span>Migration Progress</span>
                    <span>{getMigrationProgress()}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${getMigrationProgress()}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="migration-actions">
              <h2>Migration Actions</h2>
              
              <div className="action-cards">
                <div className="action-card">
                  <div className="action-header">
                    <h3>1. Create Form Templates</h3>
                    <div className={`status-indicator ${status.templatesCreated ? 'complete' : 'pending'}`}>
                      {status.templatesCreated ? 'Complete' : 'Pending'}
                    </div>
                  </div>
                  <p>Create default form templates based on the existing application structure.</p>
                  <button
                    onClick={handleCreateTemplates}
                    disabled={creatingTemplates || status.templatesCreated}
                    className="action-btn primary"
                  >
                    {creatingTemplates ? (
                      <>
                        <div className="spinner"></div>
                        Creating Templates...
                      </>
                    ) : status.templatesCreated ? (
                      'Templates Created'
                    ) : (
                      'Create Templates'
                    )}
                  </button>
                </div>

                <div className="action-card">
                  <div className="action-header">
                    <h3>2. Migrate Applications</h3>
                    <div className={`status-indicator ${isMigrationComplete() ? 'complete' : status.migratedApplications > 0 ? 'partial' : 'pending'}`}>
                      {isMigrationComplete() ? 'Complete' : status.migratedApplications > 0 ? 'Partial' : 'Pending'}
                    </div>
                  </div>
                  <p>Convert existing applications to the new dynamic format while preserving all data.</p>
                  <button
                    onClick={handleMigrateApplications}
                    disabled={!status.templatesCreated || migrating || status.legacyApplications === 0}
                    className="action-btn secondary"
                  >
                    {migrating ? (
                      <>
                        <div className="spinner"></div>
                        Migrating...
                      </>
                    ) : status.legacyApplications === 0 ? (
                      'All Migrated'
                    ) : (
                      'Migrate Applications'
                    )}
                  </button>
                </div>

                <div className="action-card full-width">
                  <div className="action-header">
                    <h3>Complete Migration</h3>
                    <div className={`status-indicator ${isMigrationComplete() ? 'complete' : 'pending'}`}>
                      {isMigrationComplete() ? 'Complete' : 'Pending'}
                    </div>
                  </div>
                  <p>Run the complete migration process in one step. This will create templates and migrate all applications.</p>
                  <button
                    onClick={handleRunCompleteMigration}
                    disabled={migrating || creatingTemplates || isMigrationComplete()}
                    className="action-btn success large"
                  >
                    {(migrating || creatingTemplates) ? (
                      <>
                        <div className="spinner"></div>
                        Running Migration...
                      </>
                    ) : isMigrationComplete() ? (
                      'Migration Complete'
                    ) : (
                      <>
                        <FaPlay />
                        Run Complete Migration
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {isMigrationComplete() && (
              <div className="migration-complete">
                <div className="complete-icon">
                  <FaCheck />
                </div>
                <h2>Migration Complete!</h2>
                <p>
                  All applications have been successfully migrated to the dynamic form system. 
                  You can now create and manage form templates through the Form Builder.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MigrationPage;
