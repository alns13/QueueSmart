import React, { useEffect, useState, useRef } from "react";
import { apiFileRequest, apiRequest } from "@/api/client.js";


import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import "./Admin_dashboard.css";

function AdminReport(){
    const [report, setReport] = useState({
    currentQueue: 0,
    activeStaff: 0,
    completedToday: 0,
    serviceData: [],
    });

    const [error, setError] = useState("");
    const [customers, setCustomers] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerHistory, setCustomerHistory] = useState([]);
    const [serviceActivity, setServiceActivity] = useState([]);
    const [queueUsage, setQueueUsage] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const historyRef = useRef(null);

    useEffect(() => {
    apiRequest("/admin/queues/reports/summary")
        .then((data) => {
        setReport(data);
        })
        .catch((requestError) => {
        setError(requestError.message);
        });
    }, []);

    useEffect(() => {
    apiRequest(`/admin/queues/reports/customers?page=${page}`)
        .then((data) => {
        setCustomers(data.customers);
        setTotalPages(data.pagination.totalPages);
        })
        .catch((requestError) => {
        setError(requestError.message);
        });
    }, [page]);

    useEffect(() => {
    apiRequest("/admin/queues/reports/services")
        .then((data) => {
        setServiceActivity(data.serviceActivity);
        })
        .catch((requestError) => {
        setError(requestError.message);
        });
    }, []);

    useEffect(() => {
        apiRequest("/admin/queues/reports/queue-usage")
            .then((data) => {
            setQueueUsage(data.queueUsage);
            })
            .catch((requestError) => {
            setError(requestError.message);
            });
    }, []);



    const handleViewHistory = (customer) => {
    if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(null);
        setCustomerHistory([]);
        return;
    }

    setSelectedCustomer(customer);

    apiRequest(`/admin/queues/reports/customers/${customer.id}/history`)
        .then((data) => {
        setCustomerHistory(data.history);

        setTimeout(() => {
            historyRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
            });
        }, 100);
        })
        .catch((requestError) => {
        setError(requestError.message);
        });
    };

    const handleExportQueueUsage = async () => {
        setIsExporting(true);
        setError("");

        try {
            const { blob, filename } = await apiFileRequest(
                "/admin/queues/reports/queue-usage.csv"
            );
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            // Release the temporary URL after the browser has started the download.
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div>
            <div className="report_header">
                <h1>Report</h1>
                <button
                    className="report_export_button"
                    type="button"
                    onClick={handleExportQueueUsage}
                    disabled={isExporting}
                >
                    {isExporting ? "Exporting..." : "Export Queue Usage CSV"}
                </button>
                {error && <p className="error_message">{error}</p>}
            </div>
            <div className="from1">
                <div className="stats">
                    <div className="card">
                        <div className="title">Current Queue</div>
                        <div className="number">{report.currentQueue}</div>
                        <div className="remark">Customers currently waiting</div>
                    </div>
                    <div className="card">
                        <div className="title">Active Staff</div>
                        <div className="number">{report.activeStaff}</div>
                        <div className="remark">Total number of active staff</div>
                    </div>
                    <div className="card">
                        <div className="title">Completed Today</div>
                        <div className="number">{report.completedToday}</div>
                        <div className="remark">Number of customers served today</div>
                    </div>
                    
                </div>
            </div>
            <div>
                <h1 className="service_today">Today's Service Volume</h1>
                <div className="chart">
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={report.serviceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="service" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="users" name="Users" fill="#8b5cf6">
                            <LabelList
                                dataKey="users"
                                position="insideTop"
                                fontSize={16}
                                fontWeight="bold"
                                fill="white"
                            />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="service_activity">
                <h1>Service Details & Queue Activity</h1>

                <table>
                    <thead>
                    <tr>
                        <th>Service</th>
                        <th>Description</th>
                        <th>Expected Duration</th>
                        <th>Priority</th>
                        <th>Queue Status</th>
                        <th>Waiting</th>
                        <th>Serving</th>
                        <th>Served</th>
                    </tr>
                    </thead>

                    <tbody>
                    {serviceActivity.map((service) => (
                        <tr key={service.id}>
                        <td>{service.serviceName}</td>
                        <td>{service.description}</td>
                        <td>{service.expectedDuration} min</td>
                        <td>{service.priority}</td>
                        <td>{service.queueStatus}</td>
                        <td>{service.waiting}</td>
                        <td>{service.serving}</td>
                        <td>{service.served}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="queue_usage">
                <h1>Queue Usage Statistics</h1>

                <table>
                    <thead>
                    <tr>
                        <th>Queue / Service</th>
                        <th>Users Served</th>
                        <th>Average Wait Time</th>
                        <th>Total Visits</th>
                        <th>Canceled</th>
                    </tr>
                    </thead>

                    <tbody>
                    {queueUsage.map((queue) => (
                        <tr key={queue.id}>
                        <td>{queue.serviceName}</td>
                        <td>{queue.usersServed}</td>
                        <td>{queue.averageWaitTime} min</td>
                        <td>{queue.totalVisits}</td>
                        <td>{queue.canceled}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            
            <div className="customer_history">
                <h1 className="History_font">Customer Queue History</h1>

                <table>
                    <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Total Queue Visits</th>
                        <th>Action</th>
                    </tr>
                    </thead>

                    <tbody>
                    {customers.map((customer) => (
                        <tr key={customer.id}>
                        <td>{customer.name}</td>
                        <td>{customer.email}</td>
                        <td>{customer.totalVisits}</td>
                        <td>
                            <button onClick={()=>handleViewHistory(customer)}>View History</button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="pagination">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                    Previous
                    </button>

                    <span>Page {page} of {totalPages}</span>

                    <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)}>
                    Next
                    </button>
                </div>
                {selectedCustomer && (
                    <div className="customer_history_detail" ref={historyRef}>
                        <h2>{selectedCustomer.name}'s Queue History</h2>

                        <table>
                        <thead>
                            <tr>
                            <th>Service</th>
                            <th>Joined At</th>
                            <th>Completed At</th>
                            <th>Status</th>
                            <th>Priority</th>
                            </tr>
                        </thead>

                        <tbody>
                            {customerHistory.map((entry) => (
                            <tr key={entry.id}>
                                <td>{entry.service}</td>
                                <td>{new Date(entry.joinedAt).toLocaleString()}</td>
                                <td>{entry.completedAt ? new Date(entry.completedAt).toLocaleString() : "-"}</td>
                                <td>{entry.status}</td>
                                <td>{entry.priority}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                    )}
                </div>
        </div>
        
    );
}
export default AdminReport;
