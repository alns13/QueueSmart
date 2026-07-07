import { useState } from "react";


function ServerManagement(){
    const [showModal,setShowModal]=useState(false);

    return (
        <div>
            <div className="server_header">
                <h1>Service Management</h1>
                <button className="servers_button_edit" onClick={()=>setShowModal(true)}>Add Service</button>
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
            {showModal && (
                <div className="modal_overlay">
                    <div className="modal_box">
                        <h2>Add Service</h2>

                        <input type="text" placeholder="Service Name (Max 100 characters)" />
                        <input type="text" placeholder="Description" />
                        <input type="number" placeholder="Service Time (minutes)" />

                        <select>
                            <option>Normal</option>
                            <option>Priority</option>
                            <option>VIP</option>
                        </select>

                        <div className="modal_buttons">
                            <button 
                                className="servers_button_delete"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>

                            <button className="servers_button_edit">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
        
    );
}
export default ServerManagement;