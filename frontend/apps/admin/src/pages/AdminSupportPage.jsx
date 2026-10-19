import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../../src/shared/api';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getSupportTickets();
      if (res.isSuccess && Array.isArray(res.data)) {
        setTickets(res.data);
      } else {
        setTickets([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load support entries from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    try {
      const res = await adminApi.updateSupportTicketStatus(ticketId, newStatus);
      if (res.isSuccess) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
        );
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update ticket status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      (ticket.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.phoneNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || ticket.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status?.toLowerCase() === 'open').length;
  const resolvedCount = tickets.filter((t) => t.status?.toLowerCase() === 'resolved').length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px' }}>
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#18181b', margin: '0 0 6px 0' }}>
            Support Inquiries
          </h1>
          <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>
            Real-time support entries submitted across Customer and Merchant portals.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '8px',
            border: '1px solid #d4d4d8',
            background: '#ffffff',
            color: '#18181b',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <span>↻</span> {loading ? 'Refreshing...' : 'Refresh Entries'}
        </button>
      </div>

      {/* ─── SUMMARY STATS ────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e4e4e7',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#71717a' }}>Total Inquiries</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#18181b', marginTop: '6px' }}>
            {totalCount}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e4e4e7',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#71717a' }}>Open Inquiries</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#18181b', marginTop: '6px' }}>
            {openCount}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e4e4e7',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#71717a' }}>Resolved</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#71717a', marginTop: '6px' }}>
            {resolvedCount}
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER CONTROLS ─────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '10px',
          border: '1px solid #e4e4e7',
          marginBottom: '20px',
        }}
      >
        <div style={{ flex: '1 1 300px', maxWidth: '420px' }}>
          <input
            type="text"
            placeholder="Search by name, email, phone, or issue description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #d4d4d8',
              fontSize: '13px',
              color: '#18181b',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#71717a' }}>Status:</span>
          {['All', 'Open', 'In Progress', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: statusFilter === st ? '1px solid #18181b' : '1px solid #e4e4e7',
                background: statusFilter === st ? '#18181b' : '#ffffff',
                color: statusFilter === st ? '#ffffff' : '#52525b',
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ERROR STATE ──────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* ─── TABLE VIEW ───────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e4e4e7',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#71717a', fontSize: '14px' }}>
            Loading support entries...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#18181b', marginBottom: '4px' }}>
              No support entries found
            </div>
            <div style={{ fontSize: '13px', color: '#71717a' }}>
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your search criteria or status filter.'
                : 'No support requests have been submitted yet.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f4f4f5', borderBottom: '1px solid #e4e4e7' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3f3f46', width: '60px' }}>ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3f3f46', width: '140px' }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3f3f46', width: '180px' }}>Customer / Merchant</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3f3f46', width: '160px' }}>Phone No.</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3f3f46' }}>Description / Issue</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3f3f46', width: '110px' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, color: '#3f3f46', width: '140px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const createdDate = ticket.createdAt
                    ? new Date(ticket.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A';

                  const isOpen = ticket.status?.toLowerCase() === 'open';
                  const isResolved = ticket.status?.toLowerCase() === 'resolved';

                  return (
                    <tr
                      key={ticket.id}
                      style={{
                        borderBottom: '1px solid #f4f4f5',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#71717a' }}>
                        #{ticket.id}
                      </td>

                      <td style={{ padding: '14px 16px', color: '#52525b', whiteSpace: 'nowrap' }}>
                        {createdDate}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#18181b' }}>{ticket.name}</div>
                        <a
                          href={`mailto:${ticket.email}`}
                          style={{ fontSize: '12px', color: '#52525b', textDecoration: 'none' }}
                          title="Click to send email"
                        >
                          {ticket.email}
                        </a>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <a
                          href={`tel:${ticket.phoneNumber}`}
                          style={{
                            fontWeight: 600,
                            color: '#18181b',
                            textDecoration: 'none',
                            background: '#f4f4f5',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                          }}
                        >
                          {ticket.phoneNumber}
                        </a>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#27272a', maxWidth: '340px' }}>
                        <div
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.4',
                          }}
                        >
                          {ticket.description}
                        </div>
                        {ticket.description?.length > 100 && (
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(ticket)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#18181b',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                              marginTop: '2px',
                              textDecoration: 'underline',
                            }}
                          >
                            View Full Details
                          </button>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            background: isOpen ? '#f4f4f5' : isResolved ? '#e4e4e7' : '#e4e4e7',
                            color: isOpen ? '#18181b' : isResolved ? '#71717a' : '#27272a',
                            border: '1px solid #d4d4d8',
                          }}
                        >
                          {ticket.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <select
                          value={ticket.status}
                          disabled={updatingId === ticket.id}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #d4d4d8',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#18181b',
                            background: '#ffffff',
                            cursor: updatingId === ticket.id ? 'wait' : 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── TICKET DETAILS MODAL ─────────────────────────────────────────── */}
      {selectedTicket && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setSelectedTicket(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e4e4e7',
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#18181b' }}>
                  Support Ticket #{selectedTicket.id}
                </h3>
                <span style={{ fontSize: '12px', color: '#71717a' }}>
                  Submitted on {new Date(selectedTicket.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '22px',
                  cursor: 'pointer',
                  color: '#71717a',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '4px' }}>
                  Contact Name
                </label>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#18181b' }}>
                  {selectedTicket.name}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <a
                  href={`tel:${selectedTicket.phoneNumber}`}
                  style={{ fontSize: '14px', fontWeight: 600, color: '#18181b', textDecoration: 'none' }}
                >
                  {selectedTicket.phoneNumber}
                </a>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '4px' }}>
                  Email Address
                </label>
                <a
                  href={`mailto:${selectedTicket.email}`}
                  style={{ fontSize: '14px', fontWeight: 600, color: '#18181b', textDecoration: 'none' }}
                >
                  {selectedTicket.email}
                </a>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '4px' }}>
                  Current Status
                </label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #d4d4d8',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', display: 'block', marginBottom: '6px' }}>
                Full Description / Issue Message
              </label>
              <div
                style={{
                  background: '#f4f4f5',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e4e4e7',
                  fontSize: '14px',
                  color: '#18181b',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedTicket.description}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid #d4d4d8',
                  background: '#18181b',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
