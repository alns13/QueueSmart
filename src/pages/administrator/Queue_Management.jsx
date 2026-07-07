import React, { useState } from "react";

function QueueManagement(){

    const [selectedService, setSelectedService] = useState("General Inquiry");
    const queueData = {
        "General Inquiry": [
        { name: "Alex", priority: "Normal", waitTime: "5 min" },
        { name: "Emily", priority: "VIP", waitTime: "8 min" },
        { name: "Ben", priority: "Normal", waitTime: "12 min" },
        ],
        "Service Request": [
        { name: "Amy", priority: "Priority", waitTime: "10 min" },
        { name: "Kevin", priority: "Normal", waitTime: "15 min" },
        ],
        "Technical Support": [
        { name: "Zoe", priority: "VIP", waitTime: "3 min" },
        ],
    };


    return(
        <div>
            <div>
                <h1 className="queue_header">Queue Management</h1>
            </div>
            <div>
                <button
          className={selectedService === "General Inquiry" ? "queue_button active" : "queue_button"}
          onClick={() => setSelectedService("General Inquiry")}
        >General Inquiry</button>
                <button
          className={selectedService === "Service Request" ? "queue_button active" : "queue_button"}
          onClick={() => setSelectedService("Service Request")}
        >Service Request</button>
                <button
          className={selectedService === "Technical Support" ? "queue_button active" : "queue_button"}
          onClick={() => setSelectedService("Technical Support")}
        >Technical Support</button>
            </div>

            <div className="serving_card">
                <div>
                    <span className="serving_customer">Customer: {queueData[selectedService][0]?.name || "No customer"}</span>
                    <span className="serving">Serving...</span>
                    <p className="serving_service">Service: {selectedService}</p>
                    <p>Priority: {queueData[selectedService][0]?.priority || "N/A"}</p>
                </div>

                <button className="call_next_button">Call Next</button>
            </div>


            <div className="queue_card">
                <h3>{selectedService} Queue</h3>
                {queueData[selectedService].map((customer,index)=>(
                    <div className="queue_item" key={index}>
                        <div className="queue_info">
                            <div>
                                <span className="queue_position">#{index+1}</span>
                                <span className="queue_name">{customer.name}</span>
                            </div>
                            <span className="queue_priority">{customer.priority}</span>
                        </div>
                        <div className="queue_timebutton">
                            <p>Estimated Wait Time: {customer.waitTime}</p>
                            <div>
                                <button className="queue_managebutton">Call</button>
                                <button className="queue_managebutton">Remove</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
export default QueueManagement;