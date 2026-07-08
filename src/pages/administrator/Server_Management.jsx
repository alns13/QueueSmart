import { useState } from "react";


function ServerManagement(){
    const [showModal,setShowModal]=useState(false);
    const [serviceName, setServiceName] = useState("");
    const [description, setDescription] = useState("");
    const [serviceTime, setServiceTime] = useState("");
    const [priority, setPriority] = useState("Normal");
    const [error, setError] = useState("");

    const handleSaveService = () => {
        if (serviceName.trim() === "") {
            setError("Service name is required.");
            return;
        }

        if (description.trim() === "") {
            setError("Description is required.");
            return;
        }

        if (serviceTime === "") {
            setError("Service time is required.");
            return;
        }

        if (serviceName.length > 100) {
            setError("Service name must be 100 characters or less.");
            return;
        }

        if (description.length > 150) {
            setError("Description must be 150 characters or less.");
            return;
        }

        if (Number(serviceTime) <= 0) {
            setError("Service time must be greater than 0.");
            return;
        }

        setError("");
        setShowModal(false);
    };

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

                        {error && <p className="error_message">{error}</p>}

                        <input
                            type="text"
                            placeholder="Service Name (Max 100 characters)"
                            value={serviceName}
                            maxLength={100}
                            required
                            onChange={(e) => setServiceName(e.target.value)}
                        />

                        <input
                            type="text"
                            placeholder="Description (Max 150 characters)"
                            value={description}
                            maxLength={150}
                            required
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        <input
                            type="number"
                            placeholder="Service Time (minutes)"
                            value={serviceTime}
                            min="1"
                            required
                            onChange={(e) => setServiceTime(e.target.value)}
                        />

                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
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

                            <button className="servers_button_edit" onClick={handleSaveService}>
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
