import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faEye, faChartBar, faDollarSign, faSyncAlt, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { useMasterAuth, useProperty, useAdminAuth } from '../../../hooks/useRedux';
import { useToast } from '../../../contexts/ToastContext';
import BackButton from '../../../components/common/BackButton';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import heroImg from '../../../assets/images/backgrounds/LP.jpg';
import './ReportsPage.css';
import AYGLogo from '../../../assets/images/logo/AYG.png';

const ReportsPage = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useMasterAuth();
  const { apartments, saleApartments } = useProperty();
  const { getAllAdmins } = useAdminAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [adminStats, setAdminStats] = useState([]);
  const [overallStats, setOverallStats] = useState({});
  const [selectedTimeRange, setSelectedTimeRange] = useState('all'); // all, month, week
  const [sortBy, setSortBy] = useState('totalProperties'); // totalProperties, revenue, performance
  const { showInfo } = useToast();

  const loadReportsData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get all admins
      const adminsList = getAllAdmins();
      setAdmins(adminsList);

      // Calculate stats for each admin
      const statsData = adminsList.map(admin => {
        const adminApartments = apartments.filter(apt => 
          apt.createdBy === admin.email || 
          apt.createdBy === admin.id ||
          apt.createdBy === admin.accountOrMobile
        );

        const adminStudios = adminApartments.reduce((total, apt) => 
          total + (apt.studios ? apt.studios.length : 0), 0
        );

        const availableStudios = adminApartments.reduce((total, apt) => 
          total + (apt.studios ? apt.studios.filter(studio => studio.isAvailable).length : 0), 0
        );

        const rentedStudios = adminStudios - availableStudios;

        // Calculate estimated monthly revenue (assuming average rent per studio)
        const estimatedRevenue = adminApartments.reduce((total, apt) => {
          if (!apt.studios) return total;
          return total + apt.studios.reduce((studioTotal, studio) => {
            if (!studio.isAvailable && studio.pricePerMonth) {
              return studioTotal + studio.pricePerMonth;
            }
            return studioTotal;
          }, 0);
        }, 0);

        // Calculate performance score (based on occupancy rate and total properties)
        const occupancyRate = adminStudios > 0 ? (rentedStudios / adminStudios) * 100 : 0;
        const performanceScore = Math.round((occupancyRate * 0.7) + (adminApartments.length * 5) + (adminStudios * 2));

        return {
          admin,
          totalApartments: adminApartments.length,
          totalStudios: adminStudios,
          availableStudios,
          rentedStudios,
          occupancyRate: occupancyRate.toFixed(1),
          estimatedRevenue,
          performanceScore,
          joinedDate: admin.createdAt || 'Unknown',
          lastActivity: admin.lastLogin || 'Unknown'
        };
      });

      // Sort stats based on selected criteria
      const sortedStats = sortStats(statsData, sortBy);
      setAdminStats(sortedStats);

      // Calculate overall statistics
      const overall = {
        totalAdmins: adminsList.length,
        totalApartments: apartments.length,
        totalStudios: apartments.reduce((total, apt) => total + (apt.studios ? apt.studios.length : 0), 0),
        totalAvailable: apartments.reduce((total, apt) => 
          total + (apt.studios ? apt.studios.filter(studio => studio.isAvailable).length : 0), 0
        ),
        totalRented: apartments.reduce((total, apt) => 
          total + (apt.studios ? apt.studios.filter(studio => !studio.isAvailable).length : 0), 0
        ),
        totalRevenue: statsData.reduce((total, stat) => total + stat.estimatedRevenue, 0),
        averageOccupancy: statsData.length > 0 ? 
          (statsData.reduce((total, stat) => total + parseFloat(stat.occupancyRate), 0) / statsData.length).toFixed(1) : 0
      };
      setOverallStats(overall);

    } catch (error) {
} finally {
      setIsLoading(false);
    }
  }, [getAllAdmins, apartments, saleApartments]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth/master-admin-login');
      return;
    }
    loadReportsData();
  }, [currentUser, navigate, loadReportsData]);

  const sortStats = (data, criteria) => {
    return [...data].sort((a, b) => {
      switch (criteria) {
        case 'totalProperties':
          return (b.totalApartments + b.totalStudios) - (a.totalApartments + a.totalStudios);
        case 'revenue':
          return b.estimatedRevenue - a.estimatedRevenue;
        case 'performance':
          return b.performanceScore - a.performanceScore;
        case 'occupancy':
          return parseFloat(b.occupancyRate) - parseFloat(a.occupancyRate);
        default:
          return b.performanceScore - a.performanceScore;
      }
    });
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    const sortedStats = sortStats(adminStats, newSortBy);
    setAdminStats(sortedStats);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    if (score >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getOccupancyColor = (rate) => {
    const numRate = parseFloat(rate);
    if (numRate >= 80) return '#22c55e';
    if (numRate >= 60) return '#f59e0b';
    if (numRate >= 40) return '#f97316';
    return '#ef4444';
  };

  if (isLoading) {
    return (
      <div className="reports-loading">
        <LoadingSpinner size="large" color="primary" />
      </div>
    );
  }

  return (
    <main className="reports-page">
      {/* Hero Section with Background Image */}
      <section 
        className="reports-hero"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="reports-hero__overlay" />
        
        {/* Navigation */}
        <nav className="reports-nav">
          <BackButton 
            text="← Back" 
            variant="transparent"
          />
          <div className="brand"><img src={AYGLogo} alt="AYG logo" className="brand-logo" /><span className="brand-text">AYG</span></div>
          <div className="nav-actions">
            <button 
              className="logout-btn"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="reports-hero__inner">
          <h1 className="reports-title">Admin Tracking & Reports</h1>
          <p className="reports-subtitle">
            Monitor admin performance and property management analytics with comprehensive insights
            into occupancy rates, revenue generation, and property portfolio growth.
          </p>
        </div>
      </section>

      {/* Overall Statistics */}
      <section className="overall-stats">
        <div className="stats-container">
          <h2 className="section-title">Overall Performance</h2>
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-content">
                <div className="stat-number">{overallStats.totalAdmins}</div>
                <div className="stat-label">Active Admins</div>
              </div>
            </div>
            <div className="stat-card info">
              <div className="stat-content">
                <div className="stat-number">{overallStats.totalApartments}</div>
                <div className="stat-label">Total Apartments</div>
              </div>
            </div>
            <div className="stat-card success">
              <div className="stat-content">
                <div className="stat-number">{overallStats.totalStudios}</div>
                <div className="stat-label">Total Studios</div>
              </div>
            </div>
            <div className="stat-card warning">
              <div className="stat-content">
                <div className="stat-number">{overallStats.totalAvailable}</div>
                <div className="stat-label">Available</div>
              </div>
            </div>
            <div className="stat-card danger">
              <div className="stat-content">
                <div className="stat-number">{overallStats.totalRented}</div>
                <div className="stat-label">Rented</div>
              </div>
            </div>
            <div className="stat-card revenue">
              <div className="stat-content">
                <div className="stat-number">{formatCurrency(overallStats.totalRevenue)}</div>
                <div className="stat-label">Monthly Revenue</div>
              </div>
            </div>
            <div className="stat-card occupancy">
              <div className="stat-content">
                <div className="stat-number">{overallStats.averageOccupancy}%</div>
                <div className="stat-label">Avg Occupancy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Controls */}
      <section className="reports-controls">
        <div className="controls-container">
          <div className="controls-left">
            <h2 className="section-title">Admin Performance Details</h2>
          </div>
          <div className="controls-right">
            <div className="filter-group">
              <label>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                <option value="performance">Performance Score</option>
                <option value="totalProperties">Total Properties</option>
                <option value="revenue">Revenue</option>
                <option value="occupancy">Occupancy Rate</option>
              </select>
            </div>
            <button 
              className="btn btn--primary refresh-btn"
              onClick={loadReportsData}
            >
              <FontAwesomeIcon icon={faSyncAlt} /> Refresh Data
            </button>
          </div>
        </div>
      </section>

      {/* Admin Details Table */}
      <section className="admin-stats-section">
        <div className="admin-stats-container">
          {adminStats.length === 0 ? (
            <div className="no-data">
              <h3>No admin data available</h3>
              <p>No admins have been created yet or no properties have been added.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Admin</th>
                    <th>Apartments</th>
                    <th>Studios</th>
                    <th>Available</th>
                    <th>Rented</th>
                    <th>Occupancy</th>
                    <th>Revenue</th>
                    <th>Performance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                {adminStats.map((stat, index) => (
                  <tr key={stat.admin.id || stat.admin.email} className="admin-row">
                    <td className="admin-info">
                      <div className="admin-avatar">
                        {(stat.admin.name || stat.admin.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="admin-details">
                        <div className="admin-name">
                          {stat.admin.name || stat.admin.email?.split('@')[0]}
                        </div>
                        <div className="admin-email">{stat.admin.email}</div>
                        <div className="admin-joined">
                          Joined: {stat.joinedDate !== 'Unknown' ? 
                            new Date(stat.joinedDate).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="number-cell">
                        <span className="main-number">{stat.totalApartments}</span>
                        <span className="sub-text">apartments</span>
                      </div>
                    </td>
                    <td>
                      <div className="number-cell">
                        <span className="main-number">{stat.totalStudios}</span>
                        <span className="sub-text">studios</span>
                      </div>
                    </td>
                    <td>
                      <div className="number-cell available">
                        <span className="main-number">{stat.availableStudios}</span>
                        <span className="sub-text">available</span>
                      </div>
                    </td>
                    <td>
                      <div className="number-cell rented">
                        <span className="main-number">{stat.rentedStudios}</span>
                        <span className="sub-text">rented</span>
                      </div>
                    </td>
                    <td>
                      <div 
                        className="occupancy-cell"
                        style={{ color: getOccupancyColor(stat.occupancyRate) }}
                      >
                        <span className="occupancy-rate">{stat.occupancyRate}%</span>
                        <div className="occupancy-bar">
                          <div 
                            className="occupancy-fill"
                            style={{ 
                              width: `${stat.occupancyRate}%`,
                              backgroundColor: getOccupancyColor(stat.occupancyRate)
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="revenue-cell">
                        <span className="revenue-amount">
                          {formatCurrency(stat.estimatedRevenue)}
                        </span>
                        <span className="revenue-period">/ month</span>
                      </div>
                    </td>
                    <td>
                      <div className="performance-cell">
                        <div 
                          className="performance-score"
                          style={{ color: getPerformanceColor(stat.performanceScore) }}
                        >
                          {stat.performanceScore}
                        </div>
                        <div className="performance-badge">
                          {stat.performanceScore >= 80 ? '★ Excellent' :
                           stat.performanceScore >= 60 ? <><FontAwesomeIcon icon={faStar} /> Good</> :
                           stat.performanceScore >= 40 ? '↑ Average' : '↓ Needs Improvement'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-details-btn"
                          onClick={() => {
                            // Could navigate to detailed admin view
                            showInfo(`Detailed view for ${stat.admin.name || stat.admin.email} coming soon!`);
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} /> View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </section>

      {/* Performance Insights */}
      {adminStats.length > 0 && (
        <section className="performance-insights">
          <div className="insights-container">
            <h2 className="section-title">Performance Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <h3><FontAwesomeIcon icon={faTrophy} /> Top Performer</h3>
              <div className="insight-content">
                <div className="performer-name">
                  {adminStats[0]?.admin.name || adminStats[0]?.admin.email?.split('@')[0]}
                </div>
                <div className="performer-stats">
                  {adminStats[0]?.totalApartments} apartments, {adminStats[0]?.totalStudios} studios
                </div>
                <div className="performer-score">
                  Performance Score: {adminStats[0]?.performanceScore}
                </div>
              </div>
            </div>
            
            <div className="insight-card">
              <h3><FontAwesomeIcon icon={faChartBar} /> Occupancy Leader</h3>
              <div className="insight-content">
                {(() => {
                  const bestOccupancy = adminStats.reduce((best, current) => 
                    parseFloat(current.occupancyRate) > parseFloat(best.occupancyRate) ? current : best
                  );
                  return (
                    <>
                      <div className="performer-name">
                        {bestOccupancy?.admin.name || bestOccupancy?.admin.email?.split('@')[0]}
                      </div>
                      <div className="performer-stats">
                        {bestOccupancy?.occupancyRate}% occupancy rate
                      </div>
                      <div className="performer-score">
                        {bestOccupancy?.rentedStudios} of {bestOccupancy?.totalStudios} studios rented
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="insight-card">
              <h3><FontAwesomeIcon icon={faDollarSign} /> Revenue Leader</h3>
              <div className="insight-content">
                {(() => {
                  const bestRevenue = adminStats.reduce((best, current) => 
                    current.estimatedRevenue > best.estimatedRevenue ? current : best
                  );
                  return (
                    <>
                      <div className="performer-name">
                        {bestRevenue?.admin.name || bestRevenue?.admin.email?.split('@')[0]}
                      </div>
                      <div className="performer-stats">
                        {formatCurrency(bestRevenue?.estimatedRevenue)} / month
                      </div>
                      <div className="performer-score">
                        {bestRevenue?.rentedStudios} active rentals
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
    </main>
  );
};

export default ReportsPage;
