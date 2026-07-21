import React, { useEffect, useState } from "react";
import { apiRequest } from "@/api/client.js";

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

    useEffect(() => {
    apiRequest("/admin/queues/reports/summary")
        .then((data) => {
        setReport(data);
        })
        .catch((requestError) => {
        setError(requestError.message);
        });
    }, []);

    return (
        <div>
            <div className="report_header">
                <h1>Report</h1>
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
                                <LabelList dataKey="users" position="top" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
        
    );
}
export default AdminReport;