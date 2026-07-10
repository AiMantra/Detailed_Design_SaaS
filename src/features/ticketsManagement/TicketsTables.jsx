import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import { RaiseATicket, RaiseTicketWithDocument, TicketChatboxModal } from "./TicketsComponents";
import { DownloadIcon, Employee, Eye, Filter, Active, Office, SearchBig, DeleteDustbin } from "../AllSvg";
import { formatDate, formatDateTime, formattedDateLong } from "../Date";
import { BASE_URL, IMAGE_URL, TESTING_URL } from "../../config/axios";
import { customSortByKey, downloadAsExcel, formatCurrencyIndian, formatRoundoff2D, handleAllError, handleErrorToast, ViewChatImageorFile, DateRangePicker } from "../CustomFunctions";
import { useLocation, useNavigate } from "react-router-dom";
import Dashboardnavbarcopy from "../../layout/Dashboardnavbarcopy";

import { Modal } from "react-bootstrap";
import { DownloadTableExcel } from "react-export-table-to-excel";
import usePermission from "../../config/permissions";



const DeleteTicket = ({ i, getTicket }) => {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => {
        setShow(true);
    };

    const handleFormSubmitDelete = async (e) => {
        e.preventDefault();
        const loadingToastId = toast.loading("Loading: Please wait..."); //toast Logic

        try {
            let res = await axios.delete(`${BASE_URL}/ticket/${i.id}/`);

            if (res.status === 200) {
                await getTicket();
                handleClose();
                toast.dismiss(loadingToastId);
                toast.success("Data deleted successfully!");
            } else {
                alert(res);
            }
        } catch (err) {
            //toast Logic
            handleErrorToast(err)
            console.error(err);

        } finally {
            toast.dismiss(loadingToastId);
        }
    };

    return (
        <>
            <button title="Delete" className="model-delete-button" onClick={handleShow}>
                <DeleteDustbin />
            </button>

            <Modal show={show} onHide={handleClose} dialogClassName="request-leave width-40vw">
                <Modal.Header closeButton>
                    <Modal.Title>Delete Ticket </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="parent-div">
                        Are You Sure You Want to delete Ticket
                        <div className="button-models">
                            <button className="model-button   font-weight500   model-button-cancel " onClick={handleClose}>
                                Cancel
                            </button>
                            <button
                                onClick={handleFormSubmitDelete}
                                className="model-button   font-weight500    model-button-delete"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                    <ToastContainer position="top-center" autoClose={1000} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
                </Modal.Body>
            </Modal>
        </>
    );
};


const CloseRequest = ({ id, getdata }) => {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [formData, setFormData] = useState({
        is_resolved: "",
        close_datetime: null,
        status: "pending",
        remark: "",
        close_by: "",
        close_by_name: "",
    });

    //******************Valedation Start********************* */

    const [errors, setErrors] = useState({});
    const [inputState, setInputState] = useState({});

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = ["remark"];
        requiredFields.forEach((field) => {
            if (!formData[field]) {
                newErrors[field] = ` ${field.charAt(0).toUpperCase() + field.slice(1)
                    } is required !`;
            }
        });

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setInputState({
            ...inputState,
            [name]: value.trim() ? "green" : "",
        });

        setFormData({
            ...formData,
            [name]: value,
        });
    };
    const handleFormSubmitPut = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            const loadingToastId = toast.loading("Loading: Please wait..."); //toast Logic

            try {
                const today = new Date().toISOString().split("T")[0];
                let res = await axios.put(`${BASE_URL}/ticket/${id}/`, {
                    is_resolved: true,
                    close_by: sessionStorage.getItem('email'),
                    close_datetime: today,
                    status: "completed",
                    remark: formData.remark,
                });

                if (res.status === 200) {
                    await getdata();
                    setShow(false);
                } else {
                    alert(res);
                }
            } catch (err) {
                //   handleErrorToast(err, loadingToastId)
            } finally {
                toast.dismiss(loadingToastId);
            }
        }
    };

    return (
        <>
            <ToastContainer position="top-center" autoClose={1000} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <button className="model-button model-button-black font-weight500" title="Close Ticket" onClick={handleShow}>
                Close
            </button>
            <Modal show={show} onHide={handleClose} dialogClassName="request-leave width-40vw">
                <Modal.Body>
                    <div className="parent-div">
                        <div className="bdy-div">
                            <div className="flex-column">
                                <label htmlFor="remark" className="form-labels  font-weight500    announce-date font-weight400  font-size-heading">
                                    Ticket Closing Remark
                                </label>
                                <textarea
                                    id="remark"
                                    type="text"
                                    name="remark"
                                    placeholder="Remarks"
                                    onChange={handleInputChange}
                                    maxLength={100}
                                    value={formData.remark}
                                    className={`form-input-textarea   font-weight400  font-size-subheading ${errors.remark
                                        ? "error"
                                        : inputState.remark
                                            ? "success"
                                            : ""
                                        }`}
                                />
                                {errors.remark && (
                                    <span className="error-message font-size-text ">{ }</span>
                                )}
                            </div>

                            <div className="button-models">
                                <button className="model-button model-button-cancel   font-weight500" onClick={handleClose}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="model-button   font-weight500    model-button-delete    font-size-heading"
                                    onClick={handleFormSubmitPut}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

const RaisedTickets = () => {
    const { SUPER_ADMIN, TICKET_SUPPORT } = usePermission();
    const [buffer, setBuffering] = useState(true); //buffering logic
    const [show, setShow] = useState(false);
    const [indexRow, setIndexRow] = useState({});
    const handleClose = () => setShow(false);
    const handleShow = (e) => {
        setShow(true);
        setIndexRow(e);
    };
    const [status_list, setStatus_list] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("pending");

    // *********** Employee Details Api Start ***********
    const [ticketsList, setTicketsList] = useState([]);
    const [filteredTicketsList, setFilteredTicketsList] = useState([]);

    const TicketForFilter = filteredTicketsList.filter(item => item.ticket_for === "Aimantra HRMS");

    const emailcheck = SUPER_ADMIN;

    const applyFilter = emailcheck ? filteredTicketsList : TicketForFilter;


    const getAllTicketsList = async () => {
        setBuffering(true); //buffering logic // Start Buffering
        try {
            const res = await axios.get(
                // `${BASE_URL}/ticket/`
                `${BASE_URL}/ticket_by_status/${selectedStatus}/`
            );
            setTicketsList(res.data);

            const uniqueDayStatus = [
                ...new Set(res.data.map((entry) => entry.status)),
            ];
            setStatus_list(uniqueDayStatus);
            const uniquePriorityStatus = [
                ...new Set(res.data.map((entry) => entry.priority)),
            ];
            setPriority_status(uniquePriorityStatus);
        } catch (err) {
            handleAllError(err)
        } finally {
            setBuffering(false); //buffering logic // End Buffering
        }
    };
    useEffect(() => {
        getAllTicketsList();
    }, [selectedStatus]);
    // *********** Employee Details Api End ***********

    const [startdate, setStartDate] = useState(``);

    const [enddate, setEndDate] = useState(``);

    
    const [asignee, setAsignee] = useState("");
    const [asigning, setAsigning] = useState("");
    const [priority, setPriority] = useState("");
    const [ticket_for, setTicketFor] = useState("Aimantra HRMS");
    const [priority_status, setPriority_status] = useState([]);

    
    useEffect(() => {
        if (startdate === null && enddate === null) {
            setStartDate("");
            setEndDate("");
        }
    }, [startdate, enddate]);

    const handleSearch = () => {
        let filteredData = ticketsList;


        

        if (selectedStatus !== 'null') {
            filteredData = filteredData.filter((ticket) =>
                status_list.includes(ticket.status)
            );
        }

        if (priority !== "") {
            if (priority === "1") {
                filteredData = filteredData.filter(
                    (ticket) => ticket.priority === priority
                );
            } else if (priority === "2") {
                filteredData = filteredData.filter(
                    (ticket) => ticket.priority === priority
                );
            } else if (priority === "3") {
                filteredData = filteredData.filter(
                    (ticket) => ticket.priority === priority
                );
            }
        }
        if (asignee) {
            const lowercaseSelectedName = asignee.toLowerCase();
            filteredData = filteredData.filter((ticket) => {
                const assigneeNameMatch = ticket.assigned_by_name
                    .toLowerCase()
                    .includes(lowercaseSelectedName);

                const assigneeEmailMatch = ticket.assigned_by
                    .toLowerCase()
                    .includes(lowercaseSelectedName);

                const title = ticket.title
                    .toLowerCase()
                    .includes(lowercaseSelectedName);

                const description = ticket.description
                    .toLowerCase()
                    .includes(lowercaseSelectedName);

                return (
                    assigneeNameMatch || assigneeEmailMatch || title || description
                );
            });
        }

        if (startdate !== "") {
            filteredData = filteredData.filter(
                (ticket) =>
                    ticket.due_date >= startdate && ticket.assign_date >= startdate
            );
        }
        if (enddate !== "") {
            filteredData = filteredData.filter(
                (ticket) =>
                    ticket.assign_date <= enddate && ticket.assign_date <= enddate
            );
        }
        if (ticket_for !== "") {
            filteredData = filteredData.filter(
                (ticket) => ticket.ticket_for === ticket_for
            );
        }

        setFilteredTicketsList(filteredData);
    };

    useEffect(() => {
        handleSearch();
    }, [
        selectedStatus,
        ticketsList,
        asignee,
        startdate,
        enddate,
        asigning,
        priority,
        ticket_for,
    ]);

    const statusName = [
        
        {
            status: "pending",
            name: "Pending",
        },
        // {
        //     status: "inprocess",
        //     name: "In Process",
        // },
        {
            status: "completed",
            name: "Completed",
        },
        // {
        //     status: "close",
        //     name: "Close",
        // },
    ];



    const createMarkup = (content) => {
        const linkRegex = /(?:https?|ftp):\/\/[^\s]+/g;
        return {
            __html: content.replace(linkRegex, (url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
            }),
        };
    };

    const navigate = useNavigate();
    const currentUrl = window.location.href;
    const urlParts = currentUrl.split("/");
    const ticketUrl = "/" + urlParts[3] + "/ticket/";
    const ViewTicketDetails = (id) => {
        navigate(ticketUrl + id + '/', { state: { i: id, toggleState: 2 } });
    };


    return (
        <>
            <ToastContainer
                position="top-center"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <div className="content-tabs">
                <div className="attendance-subcont">
                    <div className="field-cont">
                       
                        <div title=' Date Range' className="field-cont-div ">

                            <DateRangePicker startDate={startdate} endDate={enddate} placeHolder1="From Date" placeHolder2="To Date" onChange={(start, end) => {
                                setStartDate(start);
                                setEndDate(end);

                            }} />
                            <hr className="field-cont-hr" />
                        </div>
                        <div className="field-cont-div">
                            <Filter />
                            <select
                                className="attendance-input-field width-10vw   date-field"
                                type="text"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="null">All</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                {/* {status_list.map((status) => (
                                    <option value={status}>{status}</option>
                                ))} */}
                            </select>
                            <hr className="field-cont-hr" />
                        </div>
                        {SUPER_ADMIN && <div className="field-cont-div">
                            <Filter />
                            <select
                                className="attendance-input-field width-10vw   date-field"
                                type="text"
                                value={ticket_for}
                                onChange={(e) => setTicketFor(e.target.value)}
                            >
                                <option value="">All Tickets Types</option>
                                <option value="Aimantra HRMS">Aimantra HRMS</option>
                                <option value="Aimantra CSMS">Aimantra CSMS</option>

                            </select>
                            <hr className="field-cont-hr" />
                        </div>}
                        
                        <div className="field-cont-div-svg">
                            <SearchBig />
                            <input
                                className="attendance-input-field width-15vw  "
                                placeholder="By Task, Emp & Name"
                                type="text"
                                value={asignee}
                                onChange={(e) => setAsignee(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="btn-cont">

                    </div>
                </div>
                <div className="table-css-white-background ">
                    <div className='table-box scroll-container-table'>
                        <table className="table-css width-100vw">
                            <thead className="table-heading">
                                <tr className="custom-table-head-tr">
                                    <th className="table-heading-text text-left-sr">Sr no.</th>
                                    <th className="table-heading-text">Request By</th>
                                    <th className="table-heading-text " style={{ width: "50px" }}>Title</th>
                                    <th className="table-heading-text " style={{ width: "100px" }}>Task</th>
                                    <th className="table-heading-text text-center">Assigned Date</th>
                                    <th className="table-heading-text text-center">Completed Date</th>
                                    <th className="table-heading-text text-center">Chat History</th>
                                    {/* <th className="w-1/10 align-center">Priorty</th> */}
                                    <th className="table-heading-text text-right">Status</th>
                                    <th className="table-heading-text text-center">Action</th>
                                </tr>
                            </thead>
                            {buffer ? (
                                <div className="spinner-bgdatil"></div> // buffering logic
                            ) : (
                                <tbody>
                                    {applyFilter
                                        .sort((a, b) => new Date(b.assign_date) - new Date(a.assign_date))
                                        .map((i, index) => (
                                            <React.Fragment key={index}>
                                                <tr className="custom-table-head-td">
                                                    <td className="table-body text-left-sr">
                                                        <div style={{ width: "10px", whiteSpace: "normal" }}>
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="table-body">
                                                        {i.assigned_by} <br />{i.assigned_by_name}

                                                    </td>
                                                    <td className="table-body">
                                                        <div style={{ width: "200px", whiteSpace: "normal" }}>
                                                            {i.title}
                                                        </div>
                                                    </td>
                                                    <td className="table-body">
                                                        <div style={{ width: "200px", whiteSpace: "normal" }} dangerouslySetInnerHTML={createMarkup(i.description)} />
                                                    </td>
                                                    <td className="table-body text-center">
                                                        {formatDate(i.created_at)}
                                                    </td>
                                                    <td className="table-body text-center">
                                                        {i.close_datetime !== null ? formatDate(i.close_datetime) : i.status !== 'pending' ? formatDate(i.assign_date) : "-"}
                                                    </td>
                                                    <td className="table-body text-center">
                                                        {i.remarks?.map((edata, idx) => (
                                                            <div key={idx}>
                                                                By : {edata.name}
                                                                <br />
                                                                On: {formatDate(edata.created_at)}
                                                                <br />
                                                                {edata.remark_text}
                                                            </div>
                                                        ))}
                                                        <TicketChatboxModal
                                                            i={i.id}
                                                            getAllTasks={getAllTicketsList}
                                                            clientemail={i.assigned_by}
                                                            clientname={i.assigned_by_name}
                                                            ticket_name={i.title}
                                                            status={i.status}
                                                            productname={i.ticket_for}
                                                            usedIn="Raise Ticket"
                                                            emailchat={emailcheck}
                                                            TICKET_SUPPORT={TICKET_SUPPORT}
                                                        />
                                                    </td>
                                                    {/* <td className="w-1/10 align-center">
                                                    {i.priority ? handlePriority(i.priority) : "-"}
                                                </td> */}
                                                    <td className="table-body text-right">{i.status}</td>
                                                    <td className="text-body text-right" style={{ verticalAlign: "top", display: "flex", gap: "10px", justifyContent: "center" }}>
                                                        <button
                                                            title="View Ticket Details"
                                                            onClick={() => ViewTicketDetails(i.id)}
                                                        >
                                                            <Eye />
                                                        </button>
                                                        {
                                                            i.status !== "completed" && (TICKET_SUPPORT || localStorage.getItem("tech_support") === "true") ?
                                                                <CloseRequest id={i.id} getdata={getAllTicketsList} /> : ""
                                                        }

                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

const MyTickets = () => {
    const [buffer, setBuffering] = useState(true); //buffering logic
    const [show, setShow] = useState(false);
    const [indexRow, setIndexRow] = useState({});
    const handleClose = () => setShow(false);
    const handleShow = (e) => {
        setShow(true);
        setIndexRow(e);
    };
    // *********** Employee Details Api Start ***********
    const [ticketsList, setTicketsList] = useState([]);
    const [filteredTicketsList, setFilteredTicketsList] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("null");
    const { PERMISSION_AUTHORITY, TICKET_SUPPORT } = usePermission();

    const getAllTicketsList = async () => {
        setBuffering(true); //buffering logic // Start Buffering
        try {
            const res = await axios.get(
                `${BASE_URL}/ticket-assigned-by/${sessionStorage.getItem("userEmail")}/${selectedStatus}/`
            );
            setTicketsList(res.data);

            const uniqueDayStatus = [
                ...new Set(res.data.map((entry) => entry.status)),
            ];
            setStatus_list(uniqueDayStatus);
            const uniquePriorityStatus = [
                ...new Set(res.data.map((entry) => entry.priority)),
            ];
            setPriority_status(uniquePriorityStatus);
        } catch (err) {
            handleAllError(err)
        } finally {
            setBuffering(false); //buffering logic // End Buffering
        }
    };
    useEffect(() => {
        getAllTicketsList();
    }, [selectedStatus]);

    // *********** Employee Details Api End ***********

    const [startdate, setStartDate] = useState(``);

    const [enddate, setEndDate] = useState(``);

    // *********** Filter Logic ***********

    const [status_list, setStatus_list] = useState([]);
    const [asignee, setAsignee] = useState("");
    const [asigning, setAsigning] = useState("");
    const [priority, setPriority] = useState("");
    const [priority_status, setPriority_status] = useState([]);


    useEffect(() => {
        if (startdate === null && enddate === null) {
            setStartDate('');
            setEndDate('');
        }
    }, [startdate, enddate]);

    function handlePriority(value) {
        if (value == 1) {
            return (
                <button className="priority-button font-weight600 color-tab-red">
                    High
                </button>
            );
        } else if (value == 2) {
            return (
                <button className="priority-button font-weight600 color-tab-yellow">
                    Medium
                </button>
            );

        } else if (value == 3) {
            return (
                <button className="priority-button font-weight600 color-tab-blue">
                    Low
                </button>
            );
        } else return <td className="align-center"></td>;
    }

    const handleSearch = () => {
        let filteredData = ticketsList;

        if (priority !== "") {
            if (priority === "1") {
                filteredData = filteredData.filter(
                    (employee) => employee.priority === priority
                );
            } else if (priority === "2") {
                filteredData = filteredData.filter(
                    (employee) => employee.priority === priority
                );
            } else if (priority === "3") {
                filteredData = filteredData.filter(
                    (employee) => employee.priority === priority
                );
            }
        }
        if (asignee) {
            const lowercaseSelectedName = asignee.toLowerCase();
            filteredData = filteredData.filter((employee) => {
                const assigneeNameMatch = employee.assigned_by_name
                    .toLowerCase()
                    .includes(lowercaseSelectedName);

                const assigneeEmailMatch = employee.assigned_by
                    .toLowerCase()
                    .includes(lowercaseSelectedName);

                const title = employee.title
                    .toLowerCase()
                    .includes(lowercaseSelectedName);

                const description = employee.description
                    .toLowerCase()
                    .includes(lowercaseSelectedName);

                return (
                    assigneeNameMatch || assigneeEmailMatch || title || description
                );
            });
        }

        if (startdate !== "" && enddate !== "") {
            filteredData = filteredData.filter(
                (employee) =>
                    employee.assign_date >= startdate && employee.assign_date <= enddate
            );
        } else if (startdate !== "") {
            filteredData = filteredData.filter(
                (employee) => employee.assign_date >= startdate
            );
        } else if (enddate !== "") {
            filteredData = filteredData.filter(
                (employee) => employee.assign_date <= enddate
            );
        }

        setFilteredTicketsList(filteredData);
    };

    useEffect(() => {
        handleSearch();
    }, [
        selectedStatus,
        ticketsList,
        asignee,
        startdate,
        enddate,
        asigning,
        priority,
    ]);

    const createMarkup = (content) => {
        const linkRegex = /(?:https?|ftp):\/\/[^\s]+/g;
        return {
            __html: content.replace(linkRegex, (url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
            }),
        };
    };

    const navigate = useNavigate();
    const currentUrl = window.location.href;
    const urlParts = currentUrl.split("/");
    const ticketUrl = "/" + urlParts[3] + "/ticket/";
    const ViewTicketDetails = (i) => {
        navigate(ticketUrl + i + '/', { state: { i } });
    };

    return (
        <>
            <ToastContainer
                position="top-center"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <div className="content-tabs">
                <div className="attendance-subcont">
                    <div className="field-cont">

                        <div title=' Date Range' className="field-cont-div ">

                            <DateRangePicker startDate={startdate} endDate={enddate} placeHolder1="From Date" placeHolder2="To Date" onChange={(start, end) => {
                                setStartDate(start);
                                setEndDate(end);

                            }} />
                            <hr className="field-cont-hr" />
                        </div>
                        <div className="field-cont-div">
                            <Filter />
                            <select
                                className="attendance-input-field width-10vw   date-field"
                                type="text"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="null">All</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                {/* {status_list.map((status) => (
                                    <option value={status}>{status}</option>
                                ))} */}
                            </select>
                            <hr className="field-cont-hr" />

                        </div>

                       
                        <div className="field-cont-div-svg">
                            <SearchBig />
                            <input
                                className="attendance-input-field width-15vw  "
                                placeholder="By Task, Emp & Name"
                                type="text"
                                value={asignee}
                                onChange={(e) => setAsignee(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="btn-cont">
                        <RaiseATicket getTicketList={getAllTicketsList} />
                        {/* <RaiseTicketWithDocument getTicketList={getAllTicketsList} /> */}
                    </div>
                </div>
                <div className="table-css-white-background ">
                    <div className='table-box scroll-container-table'>
                        <table className="table-css width-100vw">
                            <thead className="table-heading">
                                <tr className="custom-table-head-tr">
                                    <th className="table-heading-text" style={{ width: "50px" }}>Sr no.</th>
                                    <th className="table-heading-text">Request By</th>
                                    <th className="table-heading-text" style={{ width: "100px" }}>Title</th>
                                    <th className="table-heading-text">Task</th>
                                    <th className="table-heading-text text-center">Assigned Date</th>
                                    {/* <th className="table-heading-text">Due date</th> */}
                                    <th className="table-heading-text text-center">Chat History</th>
                                    {/* <th className="table-heading-text">Priority</th> */}
                                    <th className="table-heading-text text-center">Status</th>
                                    <th className="table-heading-text text-center">Action</th>
                                </tr>
                            </thead>
                            {buffer ? (
                                <div className="spinner-bgdatil"></div>
                            ) : (
                                <tbody>
                                    {filteredTicketsList
                                        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                                        .sort((a, b) => a.priority - b.priority)
                                        .map((i, index) => (
                                            <React.Fragment key={index}>
                                                <tr className="custom-table-head-td">
                                                    <td className="table-body ">{index + 1}</td>
                                                    <td className="table-body">
                                                        {i.assigned_by} <br />{i.assigned_by_name}
                                                    </td>
                                                    <td className="table-body">
                                                        <div style={{ width: "200px", whiteSpace: "normal" }}>
                                                            {i.title}
                                                        </div>

                                                    </td>
                                                    <td className="table-body">
                                                        <div style={{ width: "200px", whiteSpace: "normal" }} dangerouslySetInnerHTML={createMarkup(i.description)} />
                                                    </td>
                                                    <td className="table-body text-center">{formatDate(i.assign_date)}</td>
                                                    {/* <td className="table-body">{formatDate(i.due_date)}</td> */}
                                                    <td className="table-body text-center">
                                                        {i.remarks?.map((edata, index) => (
                                                            <div key={index}>
                                                                By : {edata.name}
                                                                <br />
                                                                On: {formatDate(edata.created_at)}
                                                                <br />
                                                                {edata.remark_text}
                                                            </div>
                                                        ))}
                                                        <TicketChatboxModal i={i.id} getAllTasks={getAllTicketsList} clientemail={i.assigned_by}
                                                            clientname={i.assigned_by_name}
                                                            ticket_name={i.title}
                                                            status={i.status}
                                                            productname={i.ticket_for}
                                                            TICKET_SUPPORT={TICKET_SUPPORT}
                                                        />


                                                    </td>
                                                    {/* <td className="w-1/10 align-center">
                                                    {i.priority ? handlePriority(i.priority) : '-'}
                                                </td> */}
                                                    <td className="table-body text-center">{i.status}</td>
                                                    <td className="table-body " style={{ verticalAlign: "top", display: "flex", gap: "10px", justifyContent: "center" }}>
                                                        <button
                                                            className=""
                                                            title="View Ticket Details"
                                                            onClick={() => ViewTicketDetails(i.id)}
                                                        >
                                                            <Eye />
                                                        </button>
                                                        {PERMISSION_AUTHORITY && (
                                                            <button>
                                                                <DeleteTicket i={i} getRent={getAllTicketsList} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                </tbody>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

const ViewTicket = () => {
    const { SUPER_ADMIN, TICKET_SUPPORT } = usePermission();

    const navigate = useNavigate()
    const currentUrl = window.location.href;
    const urlParts = currentUrl.split('/');
    const backUrl = "/" + urlParts[3] + `/ticketSystem`;

    const location = useLocation();
    const { i, toggleState } = location.state;

    const backroute = () => {
        navigate(backUrl, { state: { toggleState } });
    }

    const [buffer, setBuffering] = useState(true); //buffering logic
    const [ticket, setTicketData] = useState([]);
    const [ticketChat, setTicketChat] = useState([]);

    const getTicketDetails = async () => {
        setBuffering(true); //buffering logic // Start Buffering
        try {
            const ticket = await axios.get(`${BASE_URL}/ticket/${i}/`);
            setTicketData(ticket.data);
            const chat = await axios.get(`${BASE_URL}/ticketChat-by-ticket/${i}/`);
            setTicketChat(chat.data);
        } catch (err) {
            handleAllError(err)
        } finally {
            setBuffering(false); //buffering logic // End Buffering
        }
    };

    useEffect(() => {
        getTicketDetails();
    }, []);

    return (
        <>
            <Dashboardnavbarcopy name={"Ticket Details"} url="Ticket Managment" />
            <div className="content-tabs">
                <>

                    <div className=" ">
                        <div className="flex-row justify-between mb-20">
                            <button className="model-button model-button-cancel font-weight500" onClick={backroute}>Back</button>
                            <div className="flex-row">
                                {ticket.status !== "completed" && (TICKET_SUPPORT || localStorage.getItem("tech_support") === "true") ?
                                    <CloseRequest id={ticket.id} getdata={getTicketDetails} /> : ""
                                }
                                {SUPER_ADMIN || TICKET_SUPPORT && (
                                    <>
                                        <hr className="field-cont-hr" />
                                        <button>
                                            <DeleteTicket i={i} getTicket={getTicketDetails} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="table-css-white-background ">
                            <div className="flex-row justify-between">
                                <h2>
                                    Ticket ID: {ticket.id}
                                </h2>
                                <h4>
                                    <span
                                        className="priority-button behavior"
                                        data-status={ticket.status}
                                    >
                                        {ticket.status ? ticket.status.toUpperCase() : ''}
                                    </span>
                                </h4>
                            </div>
                            <div class="ticket-desc-header">Title: "{ticket.title}"</div>
                            <div class="ticket-date">
                                Assigned Date:{" "}
                                {formattedDateLong(ticket.created_at)}
                            </div>
                            <div class="ticket-date">
                                Completed Date:{" "}
                                {formattedDateLong(ticket.close_datetime)}
                            </div>
                            <div class="ticket-date">
                                Assigned By:{" "}
                                {ticket.assigned_by}
                            </div>
                            <div class="ticket-date">
                                Completed By:{" "}
                                {ticket.close_by}
                            </div>

                            <hr />
                            <div className="ticket-desc">
                                <div class="ticket-desc-header">Description of Issue</div>
                                <p>{ticket.description}</p>
                                <div class="ticket-desc-header">Completion Remarks</div>
                                <p>{ticket.remark}</p>
                            </div>
                        </div>
                        <hr />
                        <div className="table-css-white-background ">
                            <div className="flex-row justify-between">
                                <h3>
                                    Chat History:
                                </h3>
                                {TICKET_SUPPORT || localStorage.getItem("tech_support") === "true" ?
                                    <TicketChatboxModal i={i} clientemail={ticket.assigned_by}
                                        clientname={ticket.assigned_by_name}
                                        ticket_name={ticket.title}
                                        status={ticket.status}
                                        getAllTasks={getTicketDetails}
                                        productname={ticket.ticket_for}
                                        TICKET_SUPPORT={TICKET_SUPPORT}
                                    /> : ""
                                }
                            </div>

                            <ul className="chatbox">
                                {buffer ? (
                                    <div className="spinner"></div>
                                ) : ticketChat.length === 0 ? (
                                    <div
                                        className="align-center justify-center "
                                        style={{ alignSelf: "center" }}
                                    >
                                        - No Chat Historys 🪹 -
                                    </div>
                                ) : (
                                    <>
                                        {ticketChat
                                            .sort(
                                                (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                                            )
                                            .map((i, index) => (
                                                <>
                                                    {i.sender == sessionStorage.getItem("email") ? (
                                                        <>
                                                            <p className="chat-reply-timestamp font-size-text">
                                                                {i.sender_name}
                                                            </p>
                                                            <div className="chat chat-reply">
                                                                <li className="p-li">
                                                                    {i.message ? (
                                                                        <>
                                                                            <p>{i.message}</p>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <ViewChatImageorFile
                                                                                textcss={'chat-photo-reply'}
                                                                                filesrc={i.document}
                                                                            />
                                                                        </>
                                                                    )}

                                                                </li>
                                                                <p className="chat-reply-timestamp pad-r text-right font-size-label">
                                                                    {formatDateTime(i.timestamp).full}
                                                                </p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="chat-incoming-timestamp font-size-text ">
                                                                {i.sender_name}
                                                            </p>
                                                            <div className="chat chat-incoming">
                                                                <li className="p-li">
                                                                    {i.message ? (
                                                                        <>
                                                                            <p>{i.message}</p>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <ViewChatImageorFile
                                                                                textcss={'chat-photo-incoming'}
                                                                                filesrc={i.document}
                                                                            />
                                                                        </>
                                                                    )}


                                                                </li>
                                                                <p className="chat-incoming-timestamp pad-r text-right font-size-label">
                                                                    {formatDateTime(i.timestamp).full}
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            ))}
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>

                </>
            </div>
        </>
    );
};

const ImprestExpenseCustomData = () => {

    const location = useLocation();
    let filters_employee = location.state?.filter_employee !== null ? location.state?.filter_employee : 'null';
    let filters_department = location.state?.filter_department !== null ? location.state?.filter_department : `${sessionStorage.getItem("department")}`;
    let filters_subCompany = location.state?.filter_subCompany !== null ? location.state?.filter_subCompany : `${sessionStorage.getItem("company_id")}`;
    let filters_empstatus = location.state?.filter_empstatus !== null ? location.state?.filter_empstatus : 'active';

    const [imprestDateSorting, setImprestDateSorting] = useState("null");
    const [imprestAmountSorting, setImprestAmountSorting] = useState("null");
    const [expenseDateSorting, setExpenseDateSorting] = useState("null");
    const [expenseAmountSorting, setExpenseAmountSorting] = useState("null");

    const [selectedEmployee, setSelectedEmployee] = useState(sessionStorage.getItem('emp_code'));
    const [selectedProject, setSelectedProject] = useState('');
    const [employeeGet, setEmployeeGet] = useState(filters_employee || 'null');
    const [selectedDepartment, setSelectedDepartment] = useState(filters_department || 'null');
    const [selectedSubCompany, setSelectedSubCompany] = useState(filters_subCompany || `${sessionStorage.getItem("company_id")}`);
    const [active, setActive] = useState(filters_empstatus || 'active');


    const [fromdate, setFromDate] = useState('null');
    const [todate, setToDate] = useState('null');
    const [datetimefield, setDateTimeField] = useState('date');


    const [dates, setDates] = useState(0)
    // setDates(res.data.map(item => item.date).sort((a, b) => new Date(a) - new Date(b)));
    const [buffer, setBuffering] = useState(true); //buffering logic
    const [buffer1, setBuffering1] = useState(false); //buffering logic
    const [imprestExpenseData, setImprestExpenseData] = useState([]);
    const [filteredImprestExpenseData, setfilteredImprestExpenseData] = useState([]);

    const getImprestExpenseData = async () => {
        setBuffering(true); //buffering logic // Start Buffering
        try {
            // const res = await axios.get(`${BASE_URL}/wfm/expense/${selectedStatus}/${fromdate}/${todate}/${employeeGet}/`);
            const res = await axios.get(
                // `${TESTING_URL}/wfm/expenseadminapprovedcustomdata/${employeeGet}/${selectedDepartment}/null/${active}/approved/${fromdate}/${todate}/`
                `${BASE_URL}/wfm/expensecustomdatawithupdatedatefileds/${employeeGet}/${selectedDepartment}/${selectedSubCompany}/${active}/approved/${fromdate}/${todate}/${datetimefield}/`
                // `${BASE_URL}/wfm/expensecustomdatawithupdatedatefileds/CIPL578/null/null/null/null/null/null/date/`
            );

            // setImprestExpenseData(res.data);

            let filteredData = res.data;


            // Sorting logic for Imprest
            switch (imprestDateSorting) {
                case "asc_date":
                    filteredData = filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
                    break;
                case "desc_date":
                    filteredData = filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
                    break;
                case "asc_bill":
                    filteredData = filteredData.sort((a, b) => new Date(a.account_update_datetime) - new Date(b.account_update_datetime));
                    break;
                case "desc_bill":
                    filteredData = filteredData.sort((a, b) => new Date(b.account_update_datetime) - new Date(a.account_update_datetime));
                    break;
                default:
                    filteredData = filteredData
                    break;
            }

            // Sorting logic for Imprest Amount
            switch (imprestAmountSorting) {
                case "asc_amount":
                    filteredData = filteredData.sort((a, b) => {
                        const amountA = calculateTotalAmount(a);
                        const amountB = calculateTotalAmount(b);
                        return amountA - amountB; // Ascending order
                    });
                    break;
                case "desc_amount":
                    filteredData = filteredData.sort((a, b) => {
                        const amountA = calculateTotalAmount(a);
                        const amountB = calculateTotalAmount(b);
                        return amountB - amountA; // Descending order
                    });
                    break;
                default:
                    filteredData = filteredData
                    break;
            }

            // Sorting logic for Expense
            switch (expenseDateSorting) {
                case "asc_date":
                    filteredData = filteredData.sort((a, b) => {
                        const aDate = a.expense_data?.[0]?.date ? new Date(a.expense_data[0].date) : new Date(0);
                        const bDate = b.expense_data?.[0]?.date ? new Date(b.expense_data[0].date) : new Date(0);
                        return aDate - bDate;
                    });
                    break;
                case "desc_date":
                    filteredData = filteredData.sort((a, b) => {
                        const aDate = a.expense_data?.[0]?.date ? new Date(a.expense_data[0].date) : new Date(0);
                        const bDate = b.expense_data?.[0]?.date ? new Date(b.expense_data[0].date) : new Date(0);
                        return bDate - aDate;
                    });
                    break;
                case "asc_bill":
                    filteredData = filteredData.sort((a, b) => {
                        const aDatesList = a.expense_data?.[0]?.expense_details?.map(exp => new Date(exp.date)).sort((x, y) => x - y) || [];
                        const bDatesList = b.expense_data?.[0]?.expense_details?.map(exp => new Date(exp.date)).sort((x, y) => x - y) || [];
                        const aFirstDate = aDatesList.length ? aDatesList[0] : new Date(0);
                        const bFirstDate = bDatesList.length ? bDatesList[0] : new Date(0);
                        return aFirstDate - bFirstDate;
                    });
                    break;
                case "desc_bill":
                    filteredData = filteredData.sort((a, b) => {
                        const aDatesList = a.expense_data?.[0]?.expense_details?.map(exp => new Date(exp.date)).sort((x, y) => x - y) || [];
                        const bDatesList = b.expense_data?.[0]?.expense_details?.map(exp => new Date(exp.date)).sort((x, y) => x - y) || [];
                        const aFirstDate = aDatesList.length ? aDatesList[0] : new Date(0);
                        const bFirstDate = bDatesList.length ? bDatesList[0] : new Date(0);
                        return bFirstDate - aFirstDate;
                    });
                    break;
                case "asc_settlement":
                    filteredData = filteredData.sort((a, b) => {
                        const aDate = a.expense_data?.[0]?.final_update_datetime ? new Date(a.expense_data[0].final_update_datetime) : new Date(0);
                        const bDate = b.expense_data?.[0]?.final_update_datetime ? new Date(b.expense_data[0].final_update_datetime) : new Date(0);
                        return aDate - bDate;
                    });
                    break;
                case "desc_settlement":
                    filteredData = filteredData.sort((a, b) => {
                        const aDate = a.expense_data?.[0]?.final_update_datetime ? new Date(a.expense_data[0].final_update_datetime) : new Date(0);
                        const bDate = b.expense_data?.[0]?.final_update_datetime ? new Date(b.expense_data[0].final_update_datetime) : new Date(0);
                        return bDate - aDate;
                    });
                    break;
                default:
                    filteredData = filteredData;
                    break;
            }
            // Sorting logic for Imprest Amount
            switch (expenseAmountSorting) {
                case "asc_amount":
                    filteredData = filteredData.sort((a, b) => {
                        const aAmount = a.expense_data?.[0]?.utilized_amount ? Number(a.expense_data[0].utilized_amount) : 0;
                        const bAmount = b.expense_data?.[0]?.utilized_amount ? Number(b.expense_data[0].utilized_amount) : 0;
                        return aAmount - bAmount;
                    });
                    break;
                case "desc_amount":
                    filteredData = filteredData.sort((a, b) => {
                        const aAmount = a.expense_data?.[0]?.utilized_amount ? Number(a.expense_data[0].utilized_amount) : 0;
                        const bAmount = b.expense_data?.[0]?.utilized_amount ? Number(b.expense_data[0].utilized_amount) : 0;
                        return bAmount - aAmount;
                    });
                    break;
                default:
                    filteredData = filteredData
                    break;
            }

            setImprestExpenseData(filteredData);
            setfilteredImprestExpenseData(filteredData);
            // setImprestExpenseData(res.data);

        } catch (err) {
            handleAllError(err);
        } finally {
            setBuffering(false);// End Buffering
        }
    };


    const [SubCompany, setSubCompany] = useState([]);

    const getSubCompany = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/wfm/subcompany/`);
            setSubCompany(res.data);
        } catch (err) {
            handleErrorToast(err)
        }
    };

    useEffect(() => {
        getImprestExpenseData();
    }, [fromdate, todate, datetimefield, employeeGet, selectedDepartment, selectedSubCompany, active, selectedDepartment,
        imprestDateSorting, imprestAmountSorting, expenseDateSorting, expenseAmountSorting]);


    const [allemployee, setAllemployee] = useState([]);
    const [departmentLists, setDepartmentLists] = useState([]);
    const getFilterData = async () => {
        setBuffering1(true); //buffering logic // Start Buffering
        try {
            const res = await axios.get(
                `${BASE_URL}/wfm/ourcompanyempdetails/${active}/${selectedSubCompany}/`
            );
            const sortedList = customSortByKey(res.data, "emp_code");
            setAllemployee(sortedList);
            const dep = await axios.get(`${BASE_URL}/wfm/departmentfilterbysubcompanycount/${sessionStorage.getItem('company_id') || 'null'}/active/`);
            setDepartmentLists(dep.data);
        } catch (err) {
            handleAllError(err);
        } finally {
            setBuffering1(false); //buffering logic // End Buffering
        }
    };


    useEffect(() => {
        getFilterData();
        getSubCompany();
    }, [active, selectedSubCompany]);

    const options = allemployee
        .sort((a, b) => a.emp_code - b.emp_code)
        .map((i) => ({
            value: i.emp_code,
            label: `${i.emp_code} - ${i.name}`,
        }));

    const nullOption = { value: 'null', label: 'Select Employee Code' };

    const handleChange = (selectedOption) => {
        if (selectedOption) {
            // Set selected employee code(s)
            setEmployeeGet(selectedOption.value);
        } else {
            setEmployeeGet(null); // Clear selection
        }
    };
    const handleImprestDateSortChange = (e) => setImprestDateSorting(e.target.value);
    const handleImprestAmountSortChange = (e) => setImprestAmountSorting(e.target.value);
    const handleExpenseDateSortChange = (e) => setExpenseDateSorting(e.target.value);
    const handleExpenseAmountSortChange = (e) => setExpenseAmountSorting(e.target.value);


    const applyFilters = () => {
        let filteredData = imprestExpenseData;

        if (selectedProject !== '') {
            const lowercaseSelectedProject = selectedProject.toLowerCase();
            filteredData = filteredData.filter((data) => {
                const nameMatch = data.ref_project_name?.toLowerCase().includes(lowercaseSelectedProject);
                const codeMatch = data.ref_project_code?.toString().includes(selectedProject);
                return nameMatch || codeMatch;
            });
        }

        setfilteredImprestExpenseData(filteredData);
    };

    // Helper function to calculate the total amount for an item
    const calculateTotalAmount = (item) => {
        if (item.rh_leave_status === "approved") {
            return (
                Number(item.approved_transportation) +
                Number(item.approved_accomodation) +
                Number(item.approved_fooding) +
                (item.other_details?.length > 0
                    ? item.other_details.reduce(
                        (total, other) => total + Number(other.approved_other || 0),
                        0
                    )
                    : 0)
            );
        } else {
            return (
                Number(item.transportation) +
                Number(item.accomodation) +
                Number(item.fooding) +
                (item.other_details?.length > 0
                    ? item.other_details.reduce((total, other) => total + Number(other.amount || 0), 0)
                    : 0)
            );
        }
    };

    useEffect(() => {
        applyFilters();
    }, [imprestExpenseData, selectedProject]);

    const tableRef = useRef(null);
    const handleDownloadExcel = () => {
        downloadAsExcel(tableRef, "Data", `CustomData`);
    };


    return (
        <div className="content-tabs">
            <div className="attendance-history-cont">
                <div className="attendance-subcont">
                    <div className="field-cont">
                        <div className="field-cont-div">
                            {/* <Employee /> */}
                            {buffer1 ?
                                <div className="align-center form-loader">
                                    <div className="bar-loader"></div>
                                </div>
                                :
                                <>
                                    <Employee />
                                    <Select
                                        className="attendance-input-field width-20vw"
                                        width="200px"
                                        options={[nullOption, ...options]} // Include "null" option at the beginning
                                        value={options.find(option => option.value === employeeGet) || nullOption}  // Ensure the correct option is selected
                                        placeholder="Select Employee Code"
                                        onChange={handleChange}
                                        isClearable
                                        styles={{
                                            control: (provided) => ({
                                                ...provided,
                                                color: '#707070',
                                                outline: 'none',
                                                border: 'none',
                                                padding: '0.6rem 0.5rem',
                                                textTransform: 'capitalize',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    border: 'none',
                                                },
                                            }),
                                            singleValue: (provided) => ({
                                                ...provided,
                                                color: '#707070',
                                            }),
                                            placeholder: (provided) => ({
                                                ...provided,
                                                color: '#707070',
                                            }),
                                            dropdownIndicator: (provided) => ({
                                                ...provided,
                                                filter: 'invert(50%)',
                                                cursor: 'pointer',
                                                left: '9.5rem',
                                                width: '20px',
                                                height: '20px',
                                            }),
                                            menu: (provided) => ({
                                                ...provided,
                                                zIndex: 9999, // Ensure dropdown menu appears above other elements
                                            }),
                                            option: (provided, state) => ({
                                                ...provided,
                                                color: state.isSelected ? '#2576bc' : '#707070',
                                                backgroundColor: state.isSelected ? 'rgba(37,118,188,0.1)' : 'white',
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: '#2576bc',
                                                    color: 'white',
                                                },
                                            }),
                                        }}
                                    />
                                </>}
                            <hr className="field-cont-hr" />
                        </div>

                        <div className="field-cont-div">
                            <Filter />
                            <select
                                className="attendance-input-field width-10vw   date-field"
                                type="text"
                                value={datetimefield}
                                onChange={(e) => setDateTimeField(e.target.value)}
                            >
                                <option value="date">Expense Date</option>
                                <option value="rh_update_datetime">RH Update Datetime</option>
                                <option value="admin_update_datetime">Admin Update Datetime</option>
                                <option value="account_update_datetime">Account Update Datetime</option>
                                <option value="final_update_datetime">Final Update Datetime</option>
                            </select>
                            <hr className="field-cont-hr" />
                        </div>

                        

                        <div className="field-cont-div">
                            <Active />
                            <select
                                className="attendance-input-field width-10vw"
                                type="text"
                                value={active}
                                onChange={(e) => setActive(e.target.value)}
                            >
                                <option value="null">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">In Active</option>
                            </select>
                            <hr className="field-cont-hr" />
                        </div>
                        <div className="field-cont-div">
                            <Office />
                            <select
                                className="attendance-input-field width-10vw   date-field"
                                type="text"
                                value={selectedSubCompany}
                                onChange={(e) => setSelectedSubCompany(e.target.value)}
                            >
                                {/* <option value="">All Sub Companies</option> */}
                                {SubCompany.sort((a, b) => a.title - b.title).map((i, index) => (
                                    <option value={i.id}>{i.title}</option>
                                ))}
                                ;
                            </select>
                            <hr className="field-cont-hr" />
                        </div>

                        <DateRangePicker
                            startDate={fromdate}
                            endDate={todate}
                            onChange={(start, end) => {
                                setFromDate(start);
                                setToDate(end);
                            }}
                            className="width-10vw"
                            showPresets={true}
                        />


                    </div>
                    <div className="btn-cont">
                       
                        <hr className="field-cont-hr" />
                        <DownloadTableExcel
                            filename={`Expense Data ${fromdate === todate ? `${fromdate}` : `${fromdate} to ${todate}`} ${datetimefield}`}
                            sheet="Details"
                            currentTableRef={tableRef.current}
                        >
                            <button className="model-button   font-weight500   model-button-print">
                                <DownloadIcon />
                            </button>
                        </DownloadTableExcel>
                    </div>
                </div>

                <div className="table-css-white-background-new scroll-container-table">
                    <table ref={tableRef} className="">
                        <thead
                            style={{
                                position: "sticky",
                                top: "0",
                                backgroundColor: "#fff",
                                zIndex: "10",
                            }}
                        >
                            <tr className="custom-table-head-tr-0P">
                                <th className="table-heading">S. No.</th>
                                <th className="table-heading">Project Reference</th>
                                <th className="table-heading" style={{ textAlign: "center" }}>Employee Code</th>
                                <th className="table-heading" style={{ textAlign: "center" }}>Employee Name</th>
                                <th className="table-heading">Date</th>
                                <th className="table-heading">Expense <b>Against</b> Imprest</th>
                                <th className="table-heading" style={{ textAlign: "center" }}>Imprest Amount</th>
                                <th className="table-heading" style={{ textAlign: "center" }}>Expense Amount</th>
                                <th className="table-heading">Utilized Money</th>
                                <th className="table-heading">Remaining Money</th>
                                <th className="table-heading">Status</th>
                                <th className="table-heading">RH Status</th>
                                <th className="table-heading">Account Status</th>
                                <th className="table-heading">Admin Status</th>
                                <th className="table-heading">Final Status</th>
                                <th className="table-heading width-15vw">Remarks</th>
                                {/* <th className="table-heading">View/Action</th> */}
                            </tr>
                        </thead>
                        {buffer ? <div className="spinner"></div> : //buffering logic
                            <tbody>
                                {filteredImprestExpenseData?.map((i, index) => {
                                    let foodingTotal = 0
                                    let approvedFoodingTotal = 0
                                    let transportationTotal = 0
                                    let approvedTransportationTotal = 0
                                    let accomodationTotal = 0
                                    let approvedAccomodationTotal = 0
                                    let otherTotal = 0
                                    let approvedOtherTotal = 0

                                    i.expense_details?.forEach(item => {
                                        const amount = parseFloat(item.item_amount);
                                        const approvedAmount = parseFloat(item.bill_approved_amt);
                                        switch (item.expense_type) {
                                            case 'fooding':
                                                foodingTotal += amount
                                                approvedFoodingTotal += approvedAmount
                                                break;
                                            case 'transportation':
                                                transportationTotal += amount
                                                approvedTransportationTotal += approvedAmount
                                                break;
                                            case 'accomodation':
                                                accomodationTotal += amount
                                                approvedAccomodationTotal += approvedAmount
                                                break;

                                            default:
                                                otherTotal += amount
                                                approvedOtherTotal += approvedAmount
                                                break;
                                        }
                                    });

                                    return (
                                        <React.Fragment key={index}>
                                            <tr className="tr-border-bottom">
                                                <td colSpan="8"></td>
                                            </tr>
                                            <tr className="custom-table-head-td">
                                                <td className="table-body">{index + 1}</td>

                                                <td className="table-body">
                                                    {i.imprest_data?.project_id ?
                                                        <table style={{ borderCollapse: "collapse", width: "100%" }}>
                                                            <tbody>
                                                                <tr>
                                                                    <td className="table-body" >Project Code</td>
                                                                    <td className="table-body" style={{ padding: "0px 4px" }}>:</td>
                                                                    <td className="align-right word-wrap-20vw">
                                                                        {i.imprest_data?.ref_project_code}
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="table-body" >Project Name</td>
                                                                    <td className="table-body" style={{ padding: "0px 4px" }}>:</td>
                                                                    <td className="align-right word-wrap-20vw">
                                                                        {i.imprest_data?.ref_project_name}
                                                                    </td>
                                                                </tr>

                                                            </tbody>
                                                        </table> :
                                                        <div className="align-center justify-center">
                                                            - No Project Referenced -
                                                        </div>
                                                    }
                                                </td>

                                                <td className="table-body" style={{ textAlign: "center" }}>
                                                    <p>{i.empcode}</p>
                                                </td>
                                                <td className="table-body" style={{ textAlign: "center" }}>
                                                    <p>{i.emp_name}</p>
                                                </td>
                                                <td className="table-body">{formatDate(i.date)}</td>
                                                <td className="table-body width-5vw"><span>{i.name}</span>
                                                    <br />
                                                    <b> Against </b>
                                                    <br />
                                                    <span className="word-wrap-10vw">{i.project_name}</span>
                                                </td>
                                                <td className="table-body">
                                                    <table style={{ borderCollapse: "collapse", width: "100%" }}>
                                                        <tbody>
                                                            <tr>
                                                                <td className="table-body" style={{ paddingBottom: "5px" }}>Transportation</td>
                                                                <td style={{ padding: "0px 4px" }}>:</td>
                                                                <td className="align-right">
                                                                    {formatCurrencyIndian(i.approved_transportation || 0)}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-body" style={{ paddingBottom: "5px" }}>Accommodation</td>
                                                                <td style={{ padding: "0px 4px" }}>:</td>
                                                                <td className="align-right">
                                                                    {formatCurrencyIndian(i.approved_accomodation || 0)}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-body" style={{ paddingBottom: "5px" }}>Food</td>
                                                                <td style={{ padding: "0px 4px" }}>:</td>
                                                                <td className="align-right">
                                                                    {formatCurrencyIndian(i.approved_fooding || 0)}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <b>
                                                                    <td className="table-body" style={{ paddingBottom: "5px" }}>Others</td>
                                                                </b>
                                                                <td style={{ padding: "0px 4px" }}>:</td>
                                                                <td className="align-right">
                                                                    <b>
                                                                        {formatCurrencyIndian(
                                                                            i?.imprest_details?.reduce(
                                                                                (sum, other) => sum + Number(other.approved_other || 0),
                                                                                0
                                                                            )
                                                                        )}
                                                                    </b>
                                                                </td>
                                                            </tr>
                                                            {i.imprest_details?.length > 0 ? (
                                                                <>
                                                                    {i.imprest_details.map((other, index) => (
                                                                        <tr key={index}>
                                                                            <td className="table-body word-wrap-10vw" style={{ paddingLeft: "5px", paddingBottom: "5px" }} >
                                                                                {other.other_name ? other.other_name : `Other-${index + 1}`}
                                                                            </td>
                                                                            <td style={{ padding: "0px 4px" }}>:</td>
                                                                            <td className="align-right">
                                                                                {formatCurrencyIndian(other.approved_other || 0)}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </>
                                                            ) : (
                                                                <tr>
                                                                    <td style={{ padding: "0px 4px", paddingBottom: "5px" }} colSpan={3}>No Other Expense</td>
                                                                </tr>
                                                            )}
                                                            <tr>
                                                                <td className="table-body" style={{ paddingBottom: "5px" }}>
                                                                    <b>Total</b>
                                                                </td>
                                                                <td style={{ padding: "0px 4px" }}>:</td>
                                                                <td className="align-right">
                                                                    <b>
                                                                        {formatCurrencyIndian(
                                                                            Number(i.approved_transportation) +
                                                                            Number(i.approved_accomodation) +
                                                                            Number(i.approved_fooding) +
                                                                            (i.imprest_details?.length > 0
                                                                                ? i.imprest_details.reduce(
                                                                                    (total, other) => total + Number(other.approved_other || 0),
                                                                                    0
                                                                                )
                                                                                : 0)
                                                                        )}
                                                                    </b>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                                <td className="table-body">
                                                    <table style={{ borderCollapse: "collapse", width: "100%" }}>
                                                        <tbody>
                                                            <tr>
                                                                <td className="table-body" style={{ paddingBottom: "5px" }}>Final Transportation</td>
                                                                <td style={{ padding: "0px 4px" }}>:</td>
                                                                <td className="align-right">
                                                                    {formatCurrencyIndian(approvedTransportationTotal || 0)}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-body" style={{ paddingBottom: "5px" }}>Final Accommodation</td>
                                                                <td style={{ padding: "0px 4px" }}>:</td>
                                                                <td className="align-right">
                                                                    {formatCurrencyIndian(approvedAccomodationTotal || 0)}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-body" style={{ paddingBottom: "5px" }}>Final Food</td>
                                                                <td style={{ padding: "0px 4px" }}>:</td>
                                                                <td className="align-right">
                                                                    {formatCurrencyIndian(approvedFoodingTotal || 0)}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <b>
                                                                    <td className="table-body" style={{ paddingBottom: "5px" }}>Final Others</td>
                                                                </b>
                                                                <td style={{ padding: "0px 4px" }}>:</td>
                                                                <td className="align-right">
                                                                    <b>
                                                                        {formatCurrencyIndian(approvedOtherTotal || 0)}
                                                                    </b>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-body" style={{ paddingBottom: "5px" }}>
                                                                    <b>Final Total</b>
                                                                </td>
                                                                <td style={{ padding: "0px 4px" }}>:</td>
                                                                <td className="align-right">
                                                                    <b>
                                                                        {formatCurrencyIndian(
                                                                            Number(approvedFoodingTotal || 0) +
                                                                            Number(approvedTransportationTotal || 0) +
                                                                            Number(approvedAccomodationTotal || 0) +
                                                                            Number(approvedOtherTotal || 0)
                                                                        )}
                                                                    </b>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                                <td className="table-body align-center">{i.utilized_amount ? formatRoundoff2D(i.utilized_amount) : '-'} Rs</td>
                                                <td className="table-body align-center">{i.remaining_amount ? formatRoundoff2D(i.remaining_amount) : '-'} Rs</td>
                                                <td className="table-body">
                                                    <span
                                                        request-status={i.rh_status}
                                                        className="request-status align-center"
                                                        title={i.rh_status === "rejected" ? `Rh Reject Reason : ${i.rh_rejection_reason}` : ""}
                                                    >
                                                        {i.rh_status === "pending"
                                                            ? "Pending For Rh Approval ⌛"
                                                            : i.rh_status === "rejected"
                                                                ? "Rh ✖, "
                                                                : "Rh ✔, "}
                                                    </span>
                                                    <br />
                                                    <span
                                                        request-status={i.account_status_a}
                                                        className="request-status align-center"
                                                        title={i.account_status_a === "rejected" ? `Account Reject Reason : ${i.account1_rejection_reason}` : ""}
                                                    >
                                                        {i.rh_status === "rejected" &&
                                                            i.admin_status === "rejected" &&
                                                            i.account_status_a === "rejected"
                                                            ? "Account ✖, "
                                                            : i.rh_status === "approved" &&
                                                                i.admin_status === "approved" &&
                                                                i.account_status_a === "pending"
                                                                ? "Pending For Account Approval ⌛"
                                                                : i.rh_status === "approved" &&
                                                                    i.admin_status === "approved" &&
                                                                    i.account_status_a === "rejected"
                                                                    ? "Accounts ✖, "
                                                                    : i.rh_status === "approved" &&
                                                                        i.admin_status === "approved" &&
                                                                        i.account_status_a === "approved"
                                                                        ? "Accounts ✔, "
                                                                        : "Accounts Stage 1: " + i.account_status_a}
                                                    </span>
                                                    <br />
                                                    <span
                                                        request-status={i.admin_status}
                                                        className="request-status align-center"
                                                        title={i.admin_status === "rejected" ? `Admin Reject Reason : ${i.admin_rejection_reason}` : ""}
                                                    >
                                                        {i.rh_status === "rejected" &&
                                                            i.admin_status === "rejected"
                                                            ? "Admin ✖, "
                                                            : i.rh_status === "approved" &&
                                                                i.admin_status === "pending"
                                                                ? "Pending For Admin Approval ⌛,"
                                                                : i.rh_status === "approved" &&
                                                                    i.admin_status === "rejected"
                                                                    ? "Admin ✖, "
                                                                    : i.rh_status === "approved" &&
                                                                        i.admin_status === "approved"
                                                                        ? "Admin ✔, "
                                                                        : "Admin Status: " + i.admin_status}
                                                    </span>
                                                    <br />
                                                    <span
                                                        request-status={i.account_status_b}
                                                        className="request-status align-center"
                                                    >
                                                        {i.rh_status === "rejected" &&
                                                            i.admin_status === "rejected" &&
                                                            i.account_status_b === "rejected"
                                                            ? "Account ✖, "
                                                            : i.rh_status === "approved" &&
                                                                i.admin_status === "approved" &&
                                                                i.account_status_b === "pending"
                                                                ? "Pending For Account Approval ⌛"
                                                                : i.rh_status === "approved" &&
                                                                    i.admin_status === "approved" &&
                                                                    i.account_status_b === "rejected"
                                                                    ? "Accounts ✖, "
                                                                    : i.rh_status === "approved" &&
                                                                        i.admin_status === "approved" &&
                                                                        i.account_status_b === "approved"
                                                                        ? "Accounts ✔, "
                                                                        : "Accounts Stage 2: " + i.account_status_b}
                                                    </span>
                                                </td>
                                                <td request-status={i.rh_status} className="request-status table-body align-center">{i.rh_status}</td>
                                                <td request-status={i.account_status_a} className="request-status table-body align-center">{i.account_status_a}</td>
                                                <td request-status={i.admin_status} className="request-status table-body align-center">{i.admin_status}</td>
                                                <td request-status={i.account_status_b} className="request-status table-body align-center">{i.account_status_b}</td>
                                                <td title="Remarks and Approval Dates" className="table-body">
                                                    <span
                                                        request-status={i.rh_status}
                                                        className="request-status "
                                                    >
                                                        {i.rh_status === "pending"
                                                            ? "-"
                                                            : i.rh_status === "rejected"
                                                                ? `Rh Reject Reason : ${i.rh_rejection_reason}`
                                                                : `Rh${i.rh_assigned ? `(${i.rh_assigned}-${i.rh_assigned_name}) ` : ''}: Verified Amounts for Bills ${i.rh_update_datetime ? `At: ${formatDateTime(i.rh_update_datetime).date}` : ''}`}
                                                    </span>
                                                    <br />
                                                    <span
                                                        request-status={i.account_status_a}
                                                        className="request-status "
                                                    >
                                                        {i.account_status_a === "pending"
                                                            ? "-"
                                                            : i.account_status_a === "rejected"
                                                                ? `Accounts Reject Reason : ${i.account1_rejection_reason}`
                                                                : `Accounts${i.account_update_by ? `(${i.account_update_by}-${i.account_update_by_name || ''}) ` : ''}: Bills Verified ${i.account_update_datetime ? `At: ${formatDateTime(i.account_update_datetime).date}` : ''}`}
                                                    </span>
                                                    <br />
                                                    <span
                                                        request-status={i.admin_status}
                                                        className="request-status "
                                                        title={i.admin_status === "rejected" ? `Admin Reject Reason : ${i.admin_rejection_reason}` : ""}
                                                    >
                                                        {i.admin_status === "pending"
                                                            ? "-"
                                                            : i.admin_status === "rejected"
                                                                ? `Admin Rejection Reason : ${i.admin_rejection_reason}`
                                                                : `Admin${i.admin_update_by ? `(${i.admin_update_by}-${i.admin_update_by_name || ''}) ` : ''}: Approved After Final Verification  ${i.admin_update_datetime ? `At: ${formatDateTime(i.admin_update_datetime).date}` : ''}`}
                                                    </span>
                                                    <br />
                                                    <span
                                                        request-status={i.account_status_b}
                                                        className="request-status "
                                                    >
                                                        {i.account_status_b === "pending"
                                                            ? "-"
                                                            : i.account_status_b === "rejected"
                                                                ? `Final Rejection Reason : ${i.account2_rejection_reason}`
                                                                : `Final${i.final_update_by ? `(${i.final_update_by}-${i.final_update_by || ''}) ` : ''}: Approved And Settled ${i.final_update_datetime ? `At: ${formatDateTime(i.final_update_datetime).date}` : ''}`}
                                                    </span>
                                                </td>
                                                {/* <td className="table-body align-center">
                                            <button
                                                className="allproject-dashboard"
                                                title="View using Navigate"
                                                onClick={(e) => openExenseSlip(i)}
                                            >
                                                <Eye />
                                            </button>
                                        </td> */}
                                            </tr>
                                        </React.Fragment>
                                    )
                                }
                                )}
                            </tbody>
                        }
                    </table>
                </div>
            </div>
        </div>
    );
};


export {
    RaisedTickets,
    MyTickets,
    ViewTicket,
    ImprestExpenseCustomData
};