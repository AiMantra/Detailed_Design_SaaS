import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FormSelect, Modal } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { handleAllError, ViewChatImageorFile } from "../CustomFunctions";
import { BASE_URL } from "../../config/axios";
import {
    AddwithBlueCircle,
    AddwithWhiteCircle,
    ArrowBullet,
    Attachment,
    Chats,
    DropdownArrow,
    DropdownArrowOption,
    Filter
} from "../AllSvg";
import { formatDateTime, formattedDate } from "../Date";
import ReactQuill from "react-quill";
import { useLocation } from "react-router-dom";
import { DocumentSection } from "../FormdataComponent";
import usePermission from "../../config/permissions";


const RaiseATicket = ({ getTicketList }) => {
    const [show, setShow] = useState(false);

    const handleClose = () => {
        setShow(false);
        setFormData({
            title: "",
            description: "",
            assign_date: formattedDate,
            due_date: null,
            assigned_by_name: sessionStorage.getItem("name") || "",
            assigned_by: sessionStorage.getItem("email") || "",
            status: "pending",
            ticket_for: "Aimantra HRMS",
        })
        setDocumentData({
            document: null,
            timestamp: new Date().toISOString(),
            ticket: "",
            sender: "",
            message: "",
            image: '',
            sender_name: "",
            ticket_name: "",
            ticketaccepted_by_email: "",
            ticketaccepted_by_name: "",
            ticket_for_productname: "",
            read_status: false,
            ticket_link: "",
        })

        setFileName("");
    }
    const handleShow = () => setShow(true);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assign_date: formattedDate,
        due_date: null,
        assigned_by_name: sessionStorage.getItem("name") || "",
        assigned_by: sessionStorage.getItem("email") || "",
        status: "pending",
        ticket_for: "Aimantra HRMS",

    });

    const [documentData, setDocumentData] = useState({
        document: null,
        timestamp: new Date().toISOString(),
        ticket: "",
        sender: "",
        message: "",
        image: '',
        sender_name: "",
        ticket_name: "",
        ticketaccepted_by_email: "",
        ticketaccepted_by_name: "",
        ticket_for_productname: "",
        read_status: false,
        ticket_link: "",
    });
    useEffect(() => {
        setDocumentData((prev) => ({
            ...prev,
            ticket_name: formData.title,
            ticket_for_productname: formData.ticket_for,
            ticketaccepted_by_email: formData.assigned_by,
            ticketaccepted_by_name: formData.assigned_by_name,
            sender: formData.assigned_by,
            sender_name: formData.assigned_by_name,
            ticket_link: "https://www.cipl.aimantrahrms.com/",


        }))
    }, [formData.ticket_for, formData.title, formData.assigned_by, formData.assigned_by_name, documentData.document]);


    // !  ************** Validation start **************  ! //

    const [errors, setErrors] = useState({});
    const [inputState, setInputState] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = [
            "title",
            "description",
            "assign_date",
            // "due_date",
            // "assigned_by_name",
            "assigned_by",
            // "ticket_for"
        ];
        requiredFields.forEach((field) => {
            if (!formData[field]) {
                newErrors[field] = ` ${field.charAt(0).toUpperCase() + field.slice(1)
                    } is required !`;
            }
        });

        setErrors(newErrors);
        setIsSubmitted(true);

        return Object.keys(newErrors).length === 0;
    };

    // ?  ************** Validation End **************  ! //
    const [loading, setLoading] = useState(false); //loading logic

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            setLoading(true); //loading logic
            const formDataToSend = new FormData();
            Object.keys(documentData).forEach((key) => {
                if (documentData[key] && key !== "document") {
                    formDataToSend.append(key, documentData[key]);
                }
            });

            const symbols = '!@#$%^&*()_-+=';
            const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
            const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const numbers = '0123456789';
            const now = new Date();
            let date = now.toLocaleDateString('en-GB').split('/').reverse().join('-'); // Format: YYYY-MM-DD
            let time = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-'); // Format: HH-MM-SS
            const allChars = symbols + lowercaseLetters + uppercaseLetters + numbers;
            let randomCode = '';
            for (let i = 0; i < 8; i++) {
                const randomIndex = Math.floor(Math.random() * allChars.length);
                randomCode += allChars[randomIndex];
            }

            let originalFile, customFileName, customFile;
            if (documentData.document) {
                originalFile = documentData.document;
                customFileName = `Aimantra ${date} ${time}_${randomCode} ${originalFile.name}`;
                customFile = new File([originalFile], customFileName, { type: originalFile.type });
                formDataToSend.append("document", customFile);
            }

            const loadingToastId = toast.loading("Loading: Please wait..."); //toast Logic

            try {
                let res = await axios.post(`${BASE_URL}/ticket/`, formData);

                if (res.status === 200) {
                    const getid = res.data.id;

                    // If file exists, send it separately with ticket ID
                    if (documentData.document) {
                        formDataToSend.append("ticket", getid);
                        await axios.post(`${BASE_URL}/ticketChat/`, formDataToSend, {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        });
                    }
                    await getTicketList();
                    handleClose();
                } else {
                    alert(res);
                }
            } catch (err) {
                // handleErrorToast(err, loadingToastId);
            } finally {
                setLoading(false); //loading logic
                toast.dismiss(loadingToastId);
            }
        }
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

        if (value.trim()) {
            setErrors((prevErrors) => {
                const updatedErrors = { ...prevErrors };
                delete updatedErrors[name];
                return updatedErrors;
            });
        }
    };
    const [fileName, setFileName] = useState("");

    const handleFileChange = (e) => {
        const { name, value } = e.target;
        const file = e.target.files[0];

        if (file) {
            setDocumentData({ ...documentData, [name]: file, });
            setFileName(file.name);
        } else {
            setFileName("");
        }

        if (value.trim()) {
            setErrors((prevErrors) => {
                const updatedErrors = { ...prevErrors };
                delete updatedErrors[name];
                return updatedErrors;
            });
        }

    };

    const handleClear = () => {
        setDocumentData(prevState => ({
            ...prevState,
            document: null
        }));
        setFileName("");

    }

    useEffect(() => {
        const currentUrl = window.location.href;
        const urlParts = currentUrl.split("/");
        const FRONTEND_URL = urlParts[0] + `//` + urlParts[2];

        const domainParts = urlParts[2].split(".");

        if (FRONTEND_URL.includes('hrms')) {
            setFormData({
                ...formData,
                ticket_for: "Aimantra HRMS",
            });
        } else if (FRONTEND_URL.includes('csms')) {
            setFormData({
                ...formData,
                ticket_for: "Aimantra CSMS",
            });
        }
    }, [])


    return (
        <>
            <button
                title="Raise a New Request"
                className="upload-svg"
                onClick={handleShow}
            >
                <AddwithWhiteCircle /> New Ticket
            </button>

            <Modal
                show={show}
                onHide={handleClose}
                dialogClassName="request-leave width-40vw"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Raise a Ticket Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="parent-div">
                        <div className="bdy-div">
                            <div title="Title" className="flex-column">
                                <label
                                    htmlFor="title"
                                    className="form-labels font-weight500 font-size-heading"
                                >
                                    Title<span className="required">*</span>
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    name="title"
                                    maxLength={300}
                                    placeholder="Enter Title"
                                    onChange={handleInputChange}
                                    value={formData.title}
                                    className={`form-input ${errors.title ? "error" : inputState.title ? "success" : ""
                                        }`}
                                />
                                {errors.title && (
                                    <span className="error-message">{errors.title}</span>
                                )}
                            </div>


                            <div title="Ticket For" className="flex-column">
                                <label
                                    htmlFor="ticket_for"
                                    className="form-labels font-weight500 font-size-heading"
                                >
                                    Ticket For<span className="required">*</span>
                                </label>
                                <input
                                    id="ticket_for"
                                    type="text"
                                    name="ticket_for"
                                    maxLength={300}
                                    placeholder="Enter Ticket For"
                                    onChange={handleInputChange}
                                    value={formData.ticket_for}
                                    className={`form-input ${errors.ticket_for ? "error" : inputState.ticket_for ? "success" : ""
                                        }`}
                                    readOnly
                                />
                                {errors.ticket_for && (
                                    <span className="error-message">{errors.ticket_for}</span>
                                )}
                            </div>
                            


                            <div title="Description" className="flex-column">
                                <label
                                    htmlFor="description"
                                    className="form-labels font-weight500 font-size-heading"
                                >
                                    Description<span className="required">*</span>
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="Enter Description"
                                    onChange={handleInputChange}
                                    value={formData.description}
                                    className={`form-input-textarea ${errors.description
                                        ? "error"
                                        : inputState.description
                                            ? "success"
                                            : ""
                                        }`}
                                />
                                {errors.description && (
                                    <span className="error-message">{errors.description}</span>
                                )}
                            </div>


                            

                            <div title="Description" className="flex-column">
                                <label
                                    htmlFor="description"
                                    className="form-labels font-weight500 font-size-heading"
                                >
                                    Add Screenshot
                                    {/* <span className="required">*</span> */}
                                </label>

                                <div className="flex-row justify-between">
                                    <div >
                                        <label htmlFor={`document`} className="svg-icon">
                                            <div className="svg-field form-input align-center">
                                                <Attachment />
                                            </div>

                                        </label>
                                        <input
                                            type="file"
                                            id={`document`}
                                            name="document"
                                            accept=".zip, .pdf, .xls, .xlsx"
                                            style={{ display: "none" }}
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <div style={{ width: "6vw" }}>

                                        <span className="file-name">
                                            {fileName}
                                        </span>
                                    </div>
                                    {fileName &&
                                        <div className="flex-row justify-between" style={{ width: "12vw" }}>
                                            <button title="Clear File" onClick={handleClear} className="file-clear clear-button">
                                                Clear
                                            </button>

                                        </div>
                                    }
                                </div>
                            </div>
                            {/* Note */}
                            <div className="flex-column" style={{ marginTop: "5px" }}>
                                <div style={{ color: "red" }}>
                                    Kindly note that that ticket resolution typically requires a minimum of 2-3 working days.
                                </div>
                            </div>


                            <div className="button-models">
                                <button
                                    className="model-button model-button-cancel font-weight500"
                                    type="button"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="model-button   font-weight500    model-button-leave  font-weight500    font-size-heading"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    Raise Request
                                </button>
                            </div>
                        </div>
                        <p className="error-message font-size-text">
                            {isSubmitted && Object.keys(errors).length > 0 && (
                                Object.keys(errors).length > 5 ? (
                                    <h5 className="text-center">Please fill all mandatory fields!</h5>
                                ) : (

                                    <h6 className="text-center">
                                        {Object.keys(errors).map((field) =>
                                            field.charAt(0).toUpperCase() + field.slice(1)
                                        ).join(', ') + ' are required!'}
                                    </h6>
                                )
                            )}
                        </p>
                    </div>
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
                </Modal.Body>
            </Modal>
        </>
    );
};

const RaiseTicketWithDocument = ({ getTicketList }) => {
    const [show, setShow] = useState(false);

    const handleClose = () => {
        setFormData({
            title: "",
            description: "",
            assign_date: formattedDate,
            due_date: "",
            assigned_by_name: sessionStorage.getItem("name") || "",
            assigned_by: sessionStorage.getItem("email") || "",
            status: "pending",
            documents: [{ document_name: "", document_file: "" }],
        });
        setFileNames([]);
        setShow(false);
    };
    const handleShow = () => setShow(true);

    const [fileNames, setFileNames] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assign_date: formattedDate,
        due_date: "",
        assigned_by_name: sessionStorage.getItem("name") || "",
        assigned_by: sessionStorage.getItem("email") || "",
        status: "pending",
        documents: [{ document_name: "", document_file: "" }],
    });

    // !  ************** Validation start **************  ! //

    const [errors, setErrors] = useState({});
    const [inputState, setInputState] = useState({});

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = [
            "title",
            "description",
            "assign_date",
            "due_date",
            "assigned_by_name",
            "assigned_by",
        ];
        requiredFields.forEach((field) => {
            if (!formData[field]) {
                newErrors[field] = ` ${field.charAt(0).toUpperCase() + field.slice(1)
                    } is required !`;
            }
        });

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // ?  ************** Validation End **************  ! //
    const [loading, setLoading] = useState(false); //loading logic

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            setLoading(true); //loading logic
            const loadingToastId = toast.loading("Loading: Please wait..."); //toast Logic

            try {
                let res = await axios.post(
                    `${BASE_URL}/ticket/document-bulk-with-ticket/`,
                    formData
                );

                if (res.status === 200) {
                    await getTicketList();
                    setShow(false);
                } else {
                    alert(res);
                }
            } catch (err) {
                handleAllError(err, loadingToastId);
            } finally {
                setLoading(false); //loading logic
                toast.dismiss(loadingToastId);
            }
        }
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

        setErrors((prevErrors) => {
            const updatedErrors = { ...prevErrors };
            if (value) {
                delete updatedErrors[name];
            }
            return updatedErrors;
        });
    };

    const handleDocInputChange = (index, e) => {
        const { name, value, files } = e.target;

        setFormData((prevFormData) => {
            const newDocuments = [...prevFormData.documents];
            newDocuments[index] = {
                ...newDocuments[index],
                [name]: files ? files[0] : value, // Removed .trim()
            };

            if (files) {
                setFileNames((prevFileNames) => {
                    const newFileNames = [...prevFileNames];
                    newFileNames[index] = files[0]?.name || "";
                    return newFileNames;
                });
            }

            return { ...prevFormData, documents: newDocuments };
        });
    };

    const handleAddDocuments = () => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            documents: [
                ...prevFormData.documents,
                { document_name: "", document_file: null },
            ],
        }));
    };

    const handleRemoveDocument = (index) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            documents: prevFormData.documents.filter((_, i) => i !== index),
        }));
        setFileNames((prevFileNames) =>
            prevFileNames.filter((_, i) => i !== index)
        );
    };

   
    const currentUrl = window.location.href;
    const urlParts = currentUrl.split("/");
    const FRONTEND_URL = urlParts[0] + `//` + urlParts[2];
    const domainParts = urlParts[2].split(".");
    return (
        <>
            <button
                title="Raise a New Request"
                className="upload-svg"
                onClick={handleShow}
            >
                <AddwithWhiteCircle /> New Ticket
            </button>

            <Modal
                show={show}
                onHide={handleClose}
                dialogClassName="half-modal width-40vw"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Raise a Ticket Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="parent-div">
                        <div className="bdy-div">
                            <div title="Title" className="flex-column">
                                <label
                                    htmlFor="title"
                                    className="form-labels font-weight500 font-size-heading"
                                >
                                    Title<span className="required">*</span>
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    name="title"
                                    maxLength={300}
                                    placeholder="Enter Title"
                                    onChange={handleInputChange}
                                    value={formData.title}
                                    className={`form-input ${errors.title ? "error" : inputState.title ? "success" : ""
                                        }`}
                                />
                                {errors.title && (
                                    <span className="error-message">{errors.title}</span>
                                )}
                            </div>

                            <div title="Description" className="flex-column">
                                <label
                                    htmlFor="description"
                                    className="form-labels font-weight500 font-size-heading"
                                >
                                    Description<span className="required">*</span>
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="Enter Description"
                                    onChange={handleInputChange}
                                    value={formData.description}
                                    className={`form-input-textarea ${errors.description
                                        ? "error"
                                        : inputState.description
                                            ? "success"
                                            : ""
                                        }`}
                                />
                                {errors.description && (
                                    <span className="error-message">{errors.description}</span>
                                )}
                            </div>

                            <div title="Due Date" className="flex-column">
                                <label
                                    htmlFor="due_date"
                                    className="form-labels font-weight500 font-size-heading"
                                >
                                    Due Date<span className="required">*</span>
                                </label>
                                <input
                                    id="due_date"
                                    type="date"
                                    name="due_date"
                                    onChange={handleInputChange}
                                    value={formData.due_date}
                                    className={`form-input ${errors.due_date
                                        ? "error"
                                        : inputState.due_date
                                            ? "success"
                                            : ""
                                        }`}
                                />
                                {errors.due_date && (
                                    <span className="error-message">{errors.due_date}</span>
                                )}
                            </div>

                            <div title="Assigned By Name" className="flex-column">
                                <label
                                    htmlFor="assigned_by_name"
                                    className="form-labels font-weight500 font-size-heading"
                                >
                                    Customer Name<span className="required">*</span>
                                </label>
                                <input
                                    id="assigned_by_name"
                                    type="text"
                                    name="assigned_by_name"
                                    maxLength={150}
                                    placeholder="Enter Assigned By Name"
                                    onChange={handleInputChange}
                                    value={formData.assigned_by_name}
                                    className={`form-input ${errors.assigned_by_name
                                        ? "error"
                                        : inputState.assigned_by_name
                                            ? "success"
                                            : ""
                                        }`}
                                />
                                {errors.assigned_by_name && (
                                    <span className="error-message">
                                        {errors.assigned_by_name}
                                    </span>
                                )}
                            </div>

                            <div title="Assigned By" className="flex-column">
                                <label
                                    htmlFor="assigned_by"
                                    className="form-labels font-weight500 font-size-heading"
                                >
                                    Customer Email<span className="required">*</span>
                                </label>
                                <input
                                    id="assigned_by"
                                    type="email"
                                    name="assigned_by"
                                    placeholder="Enter Email"
                                    onChange={handleInputChange}
                                    onInput={(e) => {
                                        e.target.value = e.target.value.toLowerCase().trim(); // Convert input to lowercase
                                    }}
                                    value={formData.assigned_by}
                                    className={`form-input ${errors.assigned_by
                                        ? "error"
                                        : inputState.assigned_by
                                            ? "success"
                                            : ""
                                        }`}
                                />
                                {errors.assigned_by && (
                                    <span className="error-message">{errors.assigned_by}</span>
                                )}
                            </div>

                            <DocumentSection
                                formData={formData}
                                handleDocInputChange={handleDocInputChange}
                                handleAddDocuments={handleAddDocuments}
                                handleRemoveDocument={handleRemoveDocument}
                                errors={errors}
                                fileNames={fileNames}
                                inputState={inputState}
                            />

                            <div className="button-models">
                                <button
                                    className="model-button model-button-cancel font-weight500"
                                    type="button"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="model-button   font-weight500    model-button-leave  font-weight500    font-size-heading"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    Raise Request
                                </button>
                            </div>
                        </div>
                    </div>
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
                </Modal.Body>
            </Modal>
        </>
    );
};

const TicketChatboxModal = ({ i, clientemail, clientname, ticket_name, status, productname, usedIn, TICKET_SUPPORT }) => {

    const chatboxRef = useRef(null);
    const [chatShow, setChatShow] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChatOpen = (id) => {
        getTicketChat();
        setChatShow(true);
    };
    const email = sessionStorage.getItem('email');

    const handleChatClose = () => {
        setChatShow(false);
    };

    const [formData, setFormData] = useState({
        ticket_name: "",
        ticket: "",
        sender: sessionStorage.getItem('email'),
        sender_name: sessionStorage.getItem('name'),
        message: "",
        image: '',
        document: null,
        timestamp: new Date().toISOString(),
        ticketaccepted_by_email: "",
        ticketaccepted_by_name: "",
        ticket_for_productname: "",
        status: "",
        read_status: false,
        ticket_link: "https://www.cipl.aimantrahrms.com/"

    });

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            ticketaccepted_by_email: clientemail,
            ticketaccepted_by_name: clientname,
            ticket_name: ticket_name,
            ticket_for_productname: productname,
            ticket: i,
            ticket_link: "https://www.cipl.aimantrahrms.com/"

        }))
    }, [clientname, clientemail, ticket_name]);

    const handleInputChange = (e) => {
        const { name, value, type, checked, options, files } = e.target;

        let newValue;
        if (type === "select-multiple") {
            newValue = Array.from(options)
                .filter((option) => option.selected)
                .map((option) => option.value);
        } else if (type === "checkbox") {
            newValue = checked;
        } else if (type === "file") {
            if (files.length > 0) {
                newValue = files
            } else {
                newValue = null;
            }
        } else {
            newValue = value;
        }

        setInputState((prevState) => ({
            ...prevState,
            [name]:
                type === "checkbox"
                    ? checked
                        ? "green"
                        : ""
                    : newValue
                        ? "green"
                        : "",
        }));


        setFormData((prevFormData) => {
            const updatedFormData = {
                ...prevFormData,
                [name]: newValue,
            };

            return updatedFormData;
        });

        // for removing error by clicking on input if any errors show 
        if (value.trim()) {
            setErrors((prevErrors) => {
                const updatedErrors = { ...prevErrors };
                delete updatedErrors[name];
                return updatedErrors;
            });
        }
    };

    const handleFileChange = (e) => {
        const { name, value } = e.target;
        const file = e.target.files[0];

        if (file) {
            setFormData({ ...formData, [name]: file, });
            setFileName(file.name);
        } else {
            setFileName("");
        }

        if (value.trim()) {
            setErrors((prevErrors) => {
                const updatedErrors = { ...prevErrors };
                delete updatedErrors[name];
                return updatedErrors;
            });
        }

    };
    const fileInputRef = useRef("");
    const handleClear = () => {
        setFormData(prevState => ({
            ...prevState,
            document: null
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // !  ************** Validation start **************  ! //

    const [errors, setErrors] = useState({});
    const [inputState, setInputState] = useState({});
    const [fileName, setFileName] = useState("");

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = [
            formData.document !== null ? null : "message",
        ].filter(Boolean);
        requiredFields.forEach((field) => {
            if (!formData[field]) {
                newErrors[field] = ` ${field.charAt(0).toUpperCase() + field.slice(1)
                    } is required !`;
            }
        });


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [uploadProgress, setUploadProgress] = useState(0);

    const handleSendTaskRemark = async (e) => {

        if (loading) return;

        if (e && e.preventDefault) {
            e.preventDefault();
        }

        

        if (validateForm()) {
            setLoading(true);
            // const loadingToastId = toast.loading("Loading: Please wait...");

            const formDataToSend = new FormData();
            Object.keys(formData).forEach((key) => {
                if (key !== "document") {
                    formDataToSend.append(key, formData[key]);
                }
            });

            const symbols = '!@#$%^&*()_-+=';
            const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
            const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const numbers = '0123456789';
            const now = new Date();
            let date = now.toLocaleDateString('en-GB').split('/').reverse().join('-'); // Format: YYYY-MM-DD
            let time = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-'); // Format: HH-MM-SS
            const allChars = symbols + lowercaseLetters + uppercaseLetters + numbers;
            let randomCode = '';
            for (let i = 0; i < 8; i++) {
                const randomIndex = Math.floor(Math.random() * allChars.length);
                randomCode += allChars[randomIndex];
            }

            let originalFile, customFileName, customFile;
            if (formData.document) {
                originalFile = formData.document;
                customFileName = `Aimantra ${date} ${time}_${randomCode} ${originalFile.name}`;
                customFile = new File([originalFile], customFileName, { type: originalFile.type });
                formDataToSend.append("document", customFile);
            }

            try {
                let res = await axios.post(`${BASE_URL}/ticketChat/`, formDataToSend, {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(percentCompleted);
                    },
                },
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    });

                if (res.status === 200) {
                    await getTicketChat();
                    setFileName("");
                    handleClear();
                    setFormData({
                        ...formData,
                        message: "",
                        files: '',
                        document: null
                    });
                } else {
                    alert(res);
                }
            } catch (err) {
                // handleAllError(err, loadingToastId);
                handleAllError(err);
            } finally {
                setLoading(false);
                // toast.dismiss(loadingToastId);
            }
        }
    };
    

    const [ticketChat, setTicketChat] = useState([]);
    const [buffer, setBuffering] = useState(true); //buffering logic
    const getFileNameFromLink = (url) => {
        try {
            const ImgFileUrl = "https://cipl-aimantra.s3.amazonaws.com/" || "https://cipl-aimantra.s3.ap-south-1.amazonaws.com/";
            // const ImgFileUrl = "https://cipl-aimantra.s3.amazonaws.com/" || "https://cipl-aimantra.s3.ap-south-1.amazonaws.com/";

            if (url.startsWith(ImgFileUrl)) {
                const pathAfterBase = url.slice(ImgFileUrl.length);

                const fileName = pathAfterBase.split('/').slice(1).join('/').split('?')[0];

                return fileName;
            }

            return url;
        } catch (error) {
            console.error("Error extracting file name:", error);
            return "";
        }
    };
    const getTicketChat = async () => {
        setBuffering(true); //buffering logic // Start Buffering
        try {
            const res = await axios.get(
                `${BASE_URL}/ticketChat-by-ticket/${i}/`
            );
            setTicketChat(res.data);
        } catch (err) {
            handleAllError(err);
        } finally {
            setBuffering(false); //buffering logic // End Buffering
        }
    };

    useEffect(() => {
        // Scroll to the bottom whenever new messages arrive
        if (chatboxRef.current) {
            chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
        }
    }, [ticketChat]); // Runs whenever ticketChat updates

    return (
        <>
            <button onClick={() => handleChatOpen(i)}>
                <Chats />
            </button>

            <Modal
                show={chatShow}
                onHide={handleChatClose}
                dialogClassName="request-leave "
            >
                <Modal.Header closeButton>
                    <Modal.Title title="tech_support">Ticket Chat History</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="flex-column ">
                        <ul className="chatbox" ref={chatboxRef} style={{ overflowY: "auto", maxHeight: "500px" }}>
                            {buffer ? <div className="spinner-z"></div> : null}
                            {ticketChat.length === 0 ? (
                                <div className="align-center justify-center" style={{ alignSelf: "center" }}>
                                    - No Chat Historys 🪹 -
                                </div>
                            ) : (
                                ticketChat
                                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                                    .map((i, index) => (
                                        <div key={index}>
                                            {i.sender === sessionStorage.getItem("email") ? (
                                                <>
                                                    <p className="chat-reply-timestamp font-size-text">{i.sender_name}</p>
                                                    <div className="chat chat-reply" style={{ padding: "10px" }}>
                                                        <li className="p-li">
                                                            {i.message ? <p>{i.message}</p> : <ViewChatImageorFile textcss="chat-photo-reply" filesrc={i.document} />}
                                                        </li>
                                                        <p className="chat-reply-timestamp pad-r text-right font-size-label">
                                                            {formatDateTime(i.timestamp).full}
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="chat-incoming-timestamp font-size-text">{i.sender_name}</p>
                                                    <div className="chat chat-incoming">
                                                        <li className="p-li">
                                                            {i.message ? <p>{i.message}</p> : <ViewChatImageorFile textcss="chat-photo-incoming" filesrc={i.document} />}
                                                        </li>
                                                        <p className="chat-incoming-timestamp pad-r text-right font-size-label">
                                                            {formatDateTime(i.timestamp).full}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                            )}
                        </ul>

                        {(status !== "completed" && usedIn !== "Raise Ticket") ?
                            <div>
                                <div className="flex-row justify-betweeen chat-input"
                                    style={{ height: "43px" }}
                                >

                                    {formData.document ?
                                        <>
                                            <div className="chat-input-textarea">
                                                {fileName && <p style={{ margin: "0px" }}>{fileName}</p>}
                                            </div>
                                            <button className="chat-clear" onClick={handleClear}>Clear</button>
                                        </>
                                        :

                                        <textarea
                                            id="message"
                                            name="message"
                                            maxLength={500}
                                            placeholder="Enter Message"
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendTaskRemark();
                                                }
                                            }}
                                            value={formData.message}
                                            style={{ height: "20px", minHeight: "20px", resize: "vertical" }}
                                            className={`textarea-custom ${errors.message ? "textarea-error" : inputState.message ? "textarea-success" : ""}`}
                                        />




                                    }

                                    {formData.document && (
                                        <div>
                                            <span>{formData.document.fileName}</span>


                                            {formData.document.previewUrl && (
                                                <img src={formData.document.previewUrl} alt="File Preview" width={100} />
                                            )}
                                        </div>
                                    )}

                                    <div className="btn-cont align-end gap-const">

                                        <label htmlFor="document" >
                                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M20 7V6.8C20 5.11984 20 4.27976 19.673 3.63803C19.3854 3.07354 18.9265 2.6146 18.362 2.32698C17.7202 2 16.8802 2 15.2 2H8.8C7.11984 2 6.27976 2 5.63803 2.32698C5.07354 2.6146 4.6146 3.07354 4.32698 3.63803C4 4.27976 4 5.11984 4 6.8V17.2C4 18.8802 4 19.7202 4.32698 20.362C4.6146 20.9265 5.07354 21.3854 5.63803 21.673C6.27976 22 7.11984 22 8.8 22H12.5M18 18V12.5C18 11.6716 18.6716 11 19.5 11C20.3284 11 21 11.6716 21 12.5V18C21 19.6569 19.6569 21 18 21C16.3431 21 15 19.6569 15 18V14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                            <input
                                                id="document"
                                                name="document"
                                                type="file"
                                                accept=".pdf, .doc, .docx, .png, .jpeg, .jpg"
                                                onChange={handleFileChange}
                                                ref={fileInputRef}
                                                style={{ display: "none", position: "relative" }}

                                                className={`  ${errors.document ? "error" : inputState.document ? "success" : ""
                                                    }`}
                                            />
                                        </label>


                                        {loading ? <div className="spinner-vsmall"></div> :
                                            <button onClick={handleSendTaskRemark} disabled={loading}>
                                                <ArrowBullet />
                                            </button>}
                                    </div>
                                </div>
                            </div>
                            : status !== "completed" && usedIn === "Raise Ticket" && (TICKET_SUPPORT || localStorage.getItem("tech_support") === "true") ?
                                <div>
                                    <div className="flex-row justify-betweeen chat-input"
                                        style={{ height: "43px" }}
                                    >

                                        {formData.document ?
                                            <>
                                                <div className="chat-input-textarea">
                                                    {fileName && <p style={{ margin: "0px" }}>{fileName}</p>}
                                                </div>
                                                <button className="chat-clear" onClick={handleClear}>Clear</button>
                                            </>
                                            :
                                            <textarea
                                                id="message"
                                                name="message"
                                                maxLength={500}
                                                placeholder="Enter Message"
                                                onChange={handleInputChange}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendTaskRemark();
                                                    }
                                                }}
                                                value={formData.message}
                                                style={{ height: "20px", minHeight: "20px", resize: "vertical" }}
                                                className={`textarea-custom ${errors.message ? "textarea-error" : inputState.message ? "textarea-success" : ""}`}
                                            />
                                        }

                                        {formData.document && (
                                            <div>
                                                <span>{formData.document.fileName}</span>


                                                {formData.document.previewUrl && (
                                                    <img src={formData.document.previewUrl} alt="File Preview" width={100} />
                                                )}
                                            </div>
                                        )}

                                        <div className="btn-cont align-end gap-const">
                                            <label htmlFor="document" >
                                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M20 7V6.8C20 5.11984 20 4.27976 19.673 3.63803C19.3854 3.07354 18.9265 2.6146 18.362 2.32698C17.7202 2 16.8802 2 15.2 2H8.8C7.11984 2 6.27976 2 5.63803 2.32698C5.07354 2.6146 4.6146 3.07354 4.32698 3.63803C4 4.27976 4 5.11984 4 6.8V17.2C4 18.8802 4 19.7202 4.32698 20.362C4.6146 20.9265 5.07354 21.3854 5.63803 21.673C6.27976 22 7.11984 22 8.8 22H12.5M18 18V12.5C18 11.6716 18.6716 11 19.5 11C20.3284 11 21 11.6716 21 12.5V18C21 19.6569 19.6569 21 18 21C16.3431 21 15 19.6569 15 18V14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                                <input
                                                    id="document"
                                                    name="document"
                                                    type="file"
                                                    accept=".pdf, .doc, .docx, .png, .jpeg, .jpg"
                                                    onChange={handleFileChange}
                                                    onFocus={handleClear}
                                                    style={{ display: "none", position: "relative" }}

                                                    className={`  ${errors.document ? "error" : inputState.document ? "success" : ""
                                                        }`}
                                                />
                                            </label>

                                            {loading ? <div className="spinner-vsmall"></div> :
                                                <button onClick={handleSendTaskRemark} disabled={loading}>
                                                    <ArrowBullet />
                                                </button>}
                                        </div>
                                    </div>
                                </div> :
                                <p className="text-center">
                                    {usedIn === "Raise Ticket" ? "Chat History" : "Task Completed"}
                                </p>
                        }
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    {errors.message && (
                        <span className="error-message font-size-text ">
                            {errors.message}
                        </span>
                    )}
                    {(uploadProgress > 0 && uploadProgress < 100) && (
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                            <span className="progress-text">{uploadProgress}%</span>
                        </div>
                    )}
                </Modal.Footer>
            </Modal>
        </>
    );
};

export { RaiseATicket, RaiseTicketWithDocument, TicketChatboxModal };
