function ServerManagement(){
    return (
        <div>
            <div className="server_header">
                <h1>Service Management</h1>
                <button className="servers_button_edit">Add Service</button>
            </div>
            <div className="servers_stats">
                <div className="card">
                    <div className="servers_title">General Inquiry</div>
                    <p className="servers_describe">General consultation and inquiries</p>
                    <div className="servers_time">
                        <span>Service Time: 15 min</span>
                        <span>Current Users: 5</span>
                    </div>
                    <div className="priority">Priority Level: Normal</div>
                    <div className="servers_status">
                        <span>Status: Active</span>
                        <button className="servers_button_pause">Pause</button>
                    </div>
                    <div className="divider"></div>
                    <div>
                        <button className="servers_button_edit">Edit</button>
                        <button className="servers_button_delete">Delete</button>
                    </div>
                </div>
                <div className="card">
                    <div className="servers_title">Service Request</div>
                    <p className="servers_describe">Assistance with various service requests</p>
                    <div className="servers_time">
                        <span>Service Time: 20 min</span>
                        <span>Current Users: 2</span>
                    </div>
                    <div className="priority">Priority Level: Priority</div>
                    <div className="servers_status">
                        <span>Status: Active</span>
                        <button className="servers_button_pause">Pause</button>
                    </div>
                    <div className="divider"></div>
                    <div>
                        <button className="servers_button_edit">Edit</button>
                        <button className="servers_button_delete">Delete</button>
                    </div>
                </div>
                <div className="card">
                    <div className="servers_title">Technical Support</div>
                    <p className="servers_describe">Technical support and consultation</p>
                    <div className="servers_time">
                        <span>Service Time: 10 min</span>
                        <span>Current Users: 0</span>
                    </div>
                    <div className="priority">Priority Level: VIP</div>
                    <div className="servers_status">
                        <span>Status: Active</span>
                        <button className="servers_button_pause">Pause</button>
                    </div>
                    <div className="divider"></div>
                    <div>
                        <button className="servers_button_edit">Edit</button>
                        <button className="servers_button_delete">Delete</button>
                    </div>
                </div>
                
            </div>
        </div>
    );
}
export default ServerManagement;