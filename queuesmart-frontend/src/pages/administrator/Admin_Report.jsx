import React from "react";
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

const serviceData = [
  { service: "General Inquiry", users: 18 },
  { service: "Service Request", users: 12 },
  { service: "Technical Support", users: 9 },
];

function AdminReport(){
    return (
        <div>
            <div className="report_header">
                <h1>Report</h1>
            </div>
            <div className="from1">
                <div className="stats">
                    <div className="card">
                        <div className="title">Current Queue</div>
                        <div className="number">4</div>
                        <div className="remark">Customers currently waiting</div>
                    </div>
                    <div className="card">
                        <div className="title">Active Staff</div>
                        <div className="number">3</div>
                        <div className="remark">Total number of active staff</div>
                    </div>
                    <div className="card">
                        <div className="title">Completed Today</div>
                        <div className="number">23</div>
                        <div className="remark">Number of customers served today</div>
                    </div>
                    
                </div>
            </div>
            <div>
                <h1 className="service_today">Today's Service Volume</h1>
                <div className="chart">
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={serviceData}>
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