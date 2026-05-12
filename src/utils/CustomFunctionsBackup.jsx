import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import { Modal } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import * as XLSX from "xlsx";
import { FRONTEND_URL, IMAGE_URL } from "../config/axios";
import { DatePicker, Space } from "antd";
import { formatDateTime } from "./Date";
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import UserDefaultLogo from './UserDetails/UserDefaultLogo';
import ReactDOM from 'react-dom';
import dayjs from "dayjs";
import { createPortal } from "react-dom";
import { Download, Eye, File, FileText, FileVideoCamera, ImageIcon, Paperclip, Table } from 'lucide-react';

const { RangePicker } = DatePicker;


const getFileExtension = (url) => {
    if (!url) return "";
    return url?.split(".").pop()?.toLowerCase().split(/\#|\?/)[0] || "";
};

const isImage = (url) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/.test(url);
}

const monthOptions = [
    { id: 1, name: "January" },
    { id: 2, name: "February" },
    { id: 3, name: "March" },
    { id: 4, name: "April" },
    { id: 5, name: "May" },
    { id: 6, name: "June" },
    { id: 7, name: "July" },
    { id: 8, name: "August" },
    { id: 9, name: "September" },
    { id: 10, name: "October" },
    { id: 11, name: "November" },
    { id: 12, name: "December" },
];

const getMonthName = (monthNumber) => {
    const month = monthOptions.find((m) => m.id === monthNumber);
    return month ? month.name : "";
};

const formatMonthYear = (monthyear) => {
    const [year, monthNumber] = monthyear?.split("-");
    console.log("year")
    console.log(year)
    console.log("monthNumber")
    console.log(monthNumber)
    const monthName = getMonthName(Number(monthNumber));
    return `${monthName}, ${year}`;
};

const getMonthNameFromDate = (dateStr) => {  //"2026-03-31" -> March
    if (!dateStr) return '-';

    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { month: 'long' });
};

const getMonthYearNameFromDate = (dateStr) => { // "2026-03-31" -> March 2026
    if (!dateStr) return '-';

    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
    });
};


const calculateTotal = (data, getFieldValue) => {
    return data.reduce((total, item) => {
        return total + Number(getFieldValue(item));
    }, 0);
};

const getProgressColor = (percentage) => {
    // if (percentage < 10) return '#ff747c';
    if (percentage < 33) return '#ff747c';
    if (percentage < 66) return '#f7ba1e';
    return '#06ad06';
};

const formatRoundoff = (amount) => {
    if (amount === null || amount === undefined) return "-";

    // Function to format the number with Indian number system
    const formatIndianStyle = (num) => {
        let numStr = num.toString();
        let lastThreeDigits = numStr.slice(-3);
        let otherDigits = numStr.slice(0, -3);

        if (otherDigits) {
            lastThreeDigits = "," + lastThreeDigits;
        }

        // Split other digits into groups of two and add commas
        const formattedOtherDigits = otherDigits.replace(
            /\B(?=(\d{2})+(?!\d))/g,
            ","
        );

        return formattedOtherDigits + lastThreeDigits;
    };

    return formatIndianStyle(amount);
};

const formatRoundoffComplete = (amount) => {
    const roundedAmount = Math.round(amount); // Round off to the nearest whole number
    return new Intl.NumberFormat("en-IN", {
        style: "decimal",
        minimumFractionDigits: 0, // No decimal places
        maximumFractionDigits: 0,
    }).format(roundedAmount);
};

const formatRoundoffCompleteNoComma = (amount) => {
    const roundedAmount = Math.round(amount);
    return String(roundedAmount);
};



const formatRoundoff2D = (amount) => {
    const numericAmount = Number(amount) || 0;

    return new Intl.NumberFormat("en-IN", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numericAmount);
};


const formatRoundoff3D = (amount) => {
    const roundedAmount = amount;
    return new Intl.NumberFormat("en-IN", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(roundedAmount);
};

const formatRoundoffCrores = (amount) => {
    if (amount === null || amount === undefined) return "-";

    if (amount < 10000000) {
        return new Intl.NumberFormat("en-IN", {
            maximumSignificantDigits: 21,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }
    const amountInCr = amount / 10000000;
    return `${amountInCr.toFixed(2)} Cr`;
};

const formatCurrencyIndian = (amount) => {
    if (amount === null || amount === undefined) return "-";
    const hasDecimals = amount % 1 !== 0;

    return new Intl.NumberFormat('en-IN', {
        maximumSignificantDigits: 21,
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0
    }).format(amount);
};

const formatToIndianCurrencyBackup = (amount) =>
    new Intl.NumberFormat('en-IN', {
        maximumSignificantDigits: 21,
        style: 'decimal',
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);

const formatExcelToJson = (file, dateFields = []) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });

                const sheetName = workbook.SheetNames[0]; // Use the first sheet by default
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

                const headers = json[0];
                const rows = json.slice(1);

                // Function to convert Excel serial number to a date
                const convertExcelDate = (serial) => {
                    const excelEpoch = new Date(1900, 0, 1); // Excel epoch starts on Jan 1, 1900
                    const daysOffset = serial - 1; // Subtract 1 because Excel's date system includes a leap year bug
                    return new Date(excelEpoch.getTime() + daysOffset * 86400000).toISOString().slice(0, 10); // Format as YYYY-MM-DD
                };

                // Create a formatted JSON object based on headers and row values
                const formattedJson = rows.map((row) => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        // Check if the column is one of the date fields and convert it if necessary
                        if (dateFields.includes(header) && row[index] && typeof row[index] === "number") {
                            obj[header] = convertExcelDate(row[index]); // Convert date
                        } else {
                            obj[header] = row[index] !== undefined ? row[index] : null;
                        }
                    });
                    return obj;
                });

                // Resolve the promise with the formatted JSON data
                resolve(formattedJson);
            } catch (error) {
                reject(error); // Reject the promise if there's an error
            }
        };

        reader.onerror = (error) => {
            reject(error); // Reject the promise if there's a FileReader error
        };

        reader.readAsArrayBuffer(file);
    });
};

const sortProjects = (data, codeKey) => {
    const splitCodeParts = (code) => {
        if (!code || typeof code !== 'string') {
            return { firstPart: "", numericPart: 0, alphaPart: "" };
        }

        // Split the code into two parts: before and after the last "/"
        const parts = code.trim().split("/");
        const firstPart = parts.slice(0, -1).join("/"); // Everything before the last "/"
        const lastPart = parts.pop(); // The last part after the "/"

        // Match numeric and alphabetic parts from the last part (e.g., "001CM" -> 001 and CM)
        const match = lastPart.match(/^(\d+)?([A-Za-z]+)$/); // Adjust regex to prioritize alphabetic part
        if (match) {
            return {
                firstPart, // Part before the last "/"
                numericPart: match[1] ? parseInt(match[1], 10) : 0, // Numeric part (if present)
                alphaPart: match[2] || "" // Alphabetic part
            };
        }

        return { firstPart, numericPart: 0, alphaPart: "" };
    };

    return data.sort((a, b) => {
        const aParts = splitCodeParts(a[codeKey]);
        const bParts = splitCodeParts(b[codeKey]);

        // Compare the first part (e.g., "AE/IE" vs "OM")
        if (aParts.firstPart !== bParts.firstPart) {
            return aParts.firstPart.localeCompare(bParts.firstPart);
        }

        // If the first parts are the same, compare the alphabetic part (e.g., "CM" vs "SP")
        if (aParts.alphaPart !== bParts.alphaPart) {
            return aParts.alphaPart.localeCompare(bParts.alphaPart);
        }

        // If alphabetic parts are the same, compare the numeric part (e.g., "001" vs "002")
        return aParts.numericPart - bParts.numericPart;
    });
};

const customSortByKey = (data, key) => {
    const regex = /([A-Za-z]+)|(\d+)|(\W+)/g;

    // Function to access a deeply nested object property using dot notation
    const getNestedValue = (obj, key) => {
        return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    };

    // Custom sort function for object comparison
    const sortFunction = (a, b) => {
        // Get the values to be compared from the key (handle nested properties)
        const aValue = getNestedValue(a, key);
        const bValue = getNestedValue(b, key);

        if (!aValue || !bValue) return 0; // Return 0 if either value is undefined

        // Split the strings into alphabetic, numeric, and special character parts
        const aParts = aValue.match(regex);
        const bParts = bValue.match(regex);

        for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
            const aPart = aParts[i];
            const bPart = bParts[i];

            // Check if both parts are numeric
            if (!isNaN(aPart) && !isNaN(bPart)) {
                const numA = Number(aPart);
                const numB = Number(bPart);
                if (numA !== numB) {
                    return numA - numB; // Compare numerically
                }
            } else if (aPart !== bPart) {
                return aPart.localeCompare(bPart); // Compare alphabetically or by special characters
            }
        }

        // If we reach here, the longer string is considered greater
        return aParts.length - bParts.length;
    };

    // Sort the data using the custom sort function
    return data?.sort(sortFunction);
};

const downloadAsExcel = (tableRef, sheetName = "Sheet1", fileName = "download.xls", options = {}) => {
    if (!tableRef || !tableRef.current) {
        console.error("Invalid table reference");
        return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    let rowIndex = 0;

    // Default options
    const defaultOptions = {
        applyRowStyles: false,
        styleCondition: () => false,
        // styleProps: { font: { color: { rgb: "000000" } } }
        styleProps: { font: { color: { rgb: "FF0000" } } }
    };

    const mergedOptions = { ...defaultOptions, ...options };

    for (let row of tableRef.current.rows) {
        const rowData = [];
        const rowStyles = [];

        for (let cell of row.cells) {
            const nestedTable = cell.querySelector("table");

            if (nestedTable) {
                // Format nested table data into a single cell
                let nestedData = "";
                for (let nestedRow of nestedTable.rows) {
                    for (let nestedCell of nestedRow.cells) {
                        nestedData += nestedCell.innerText + "\n"; // Append with line breaks
                    }
                }
                rowData.push(nestedData.trim()); // Add formatted nested data into the cell
            } else {
                rowData.push(cell.innerText); // Normal cells
            }

            // Apply styles if needed
            if (mergedOptions.applyRowStyles && mergedOptions.styleCondition(row)) {
                rowStyles.push(mergedOptions.styleProps);
            } else {
                rowStyles.push(null); // No style
            }
        }

        if (rowData.length > 0) {
            XLSX.utils.sheet_add_aoa(worksheet, [rowData], { origin: rowIndex });

            // Apply styles if specified
            if (mergedOptions.applyRowStyles) {
                for (let colIndex = 0; colIndex < rowData.length; colIndex++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                    if (rowStyles[colIndex]) {
                        worksheet[cellAddress].s = rowStyles[colIndex];
                    }
                }
            }

            rowIndex++;
        }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // const workbookBinary = XLSX.write(workbook, { bookType: "xls", type: "binary" });
    const workbookBinary = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
    const s2ab = (str) => {
        const buf = new ArrayBuffer(str.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i) & 0xff;
        return buf;
    };

    const buffer = s2ab(workbookBinary);
    // const blob = new Blob([buffer], { type: "application/vnd.ms-excel" });
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // a.download = fileName;
    a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
};


// usage
// const handleDownload = () => {
//     downloadTableAsExcel(bulktableRef, "Employee Details", "Employee_Details_Format.xls");
//   };
//   <button onClick={handleDownload}>Download Excel</button>

const inputMinLimit = (name, value, minValue) => {
    const numericValue = value?.trim() ? parseFloat(value) : 0;

    if (numericValue >= minValue) {
        return { success: true, error: "" };
    } else {
        return {
            success: false,
            error: `Value must be more than or equal to ${minValue}`,
        };
    }
};

const inputMaxLimit = ({ name, value, maxValue }) => {
    const numericValue = value?.trim() ? parseFloat(value) : 0;

    if (numericValue <= maxValue) {
        return { success: true, error: "" };
    } else {
        return {
            success: false,
            error: `Value must be less than or equal to ${maxValue}`,
        };
    }
};

const getFileNameFromLink = (url) => {
    try {
        const ImgFileUrl = "https://cipl-aimantra.s3.amazonaws.com/" || "https://cipl-aimantra.s3.ap-south-1.amazonaws.com/";
        // const ImgFileUrl = "https://cipl-aimantra.s3.amazonaws.com/" || "https://cipl-aimantra.s3.ap-south-1.amazonaws.com/";

        if (url.startsWith(ImgFileUrl)) {
            const pathAfterBase = url.slice(ImgFileUrl.length);
            const fileName = pathAfterBase.split('/').slice(1).join('/').split('?')[0];
            const shortName = fileName?.length > 20 ? fileName?.slice(0, 20) + '...' : fileName;
            return (
                <span title={fileName}>
                    {shortName}
                </span>
            )
        }

        return url;
    } catch (error) {
        console.error("Error extracting file name:", error);
        return "";
    }
};

const ViewFile = ({ doc, filename, filesrc, defaultIcon = false }) => {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = (e) => {
        e.preventDefault();
        setShow(true);
    }

    return (
        <>
            <ToastContainer position="top-center" autoClose={1000} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <button title={"View File"} style={{ cursor: "pointer" }} onClick={handleShow}>
                {defaultIcon ? <Paperclip /> : <AttachmentIcon source={filesrc} />}
            </button>
            <Modal show={show} onHide={handleClose} dialogClassName="request-leave width-40vw">
                <Modal.Header closeButton>
                    <Modal.Title>{filename}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="parent-div">
                        <div className="flex-row justify-center">
                            {/* <img className="bill-img" src={i.bill} alt={`Bill Image of ${i.item_name}`} /> */}
                            {isImage(filesrc) ? (
                                <img className="bill-img"
                                    // src={`${ filesrc?.startsWith('https://cipl-aimantra.s3.amazonaws.com') ? filesrc : `${IMAGE_URL}${filesrc}`} `} alt={`File/ Image of ${filename}`} 
                                    src={
                                        typeof filesrc === 'string' && filesrc?.startsWith('https://cipl-aimantra.s3.amazonaws.com')
                                            ? filesrc
                                            : `${IMAGE_URL}${filesrc}`
                                    }
                                    alt={`File/ Image of ${filename}`}
                                />
                            ) : (
                                <a href={typeof filesrc === 'string' && filesrc?.startsWith('https://cipl-aimantra.s3.amazonaws.com') ? filesrc : `${IMAGE_URL}${filesrc}`} target="_blank" rel="noreferrer">
                                    <AttachmentIcon source={filesrc} />
                                    Open Attachments
                                </a>
                            )}
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

const ViewOtherFile = ({ doc, filename, filesrc }) => {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => {
        setShow(true);
    }

    const isImage = (url) => {
        return /\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/.test(url);
    }
    return (
        <>
            <ToastContainer position="top-center" autoClose={1000} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <button title={"View File"} style={{ cursor: "pointer" }} onClick={handleShow}>
                {/* <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="25"
                    viewBox="0 0 16.933 16.933"
                    id="bill">
                    <path
                        d="M1.854 0C.819 0 0 .83 0 1.852c-.002 4.94.002 9.878.002 14.816 0 .221.256.345.429.207l1.488-1.19 1.488 1.19a.265.265 0 0 0 .33 0l1.488-1.19 1.49 1.19a.265.265 0 0 0 .33 0l1.489-1.19 1.488 1.19a.265.265 0 0 0 .33 0l1.487-1.19 1.488 1.19c.174.139.43.015.43-.207l.002-8.733h2.91a.26.26 0 0 0 .263-.263V1.854A1.85 1.85 0 0 0 15.083 0Zm0 .53h11.932c-.35.337-.556.8-.556 1.324l-.002 14.265-1.222-.98a.265.265 0 0 0-.33 0l-1.49 1.191-1.488-1.191a.264.264 0 0 0-.33 0L6.878 16.33 5.391 15.14a.265.265 0 0 0-.33 0L3.575 16.33 2.085 15.14a.264.264 0 0 0-.33 0l-1.224.98L.53 1.852c0-.77.634-1.322 1.324-1.322zm13.228 0c.73 0 1.324.586 1.324 1.324v5.554H13.76V1.854c0-.738.592-1.324 1.322-1.324zM3.707 3.439c-.133 0-.265.089-.265.266v.287c-.599.116-1.058.63-1.058 1.252 0 .42.217.672.48.799.264.127.552.147.816.174.265.027.506.06.639.125.133.064.181.15.181.32 0 .406-.34.743-.782.746-.384-.014-.658-.23-.784-.623-.106-.339-.614-.175-.503.162.152.475.48.844 1.011.96v.294c0 .354.53.354.53 0v-.282c.598-.116 1.058-.635 1.058-1.257 0-.388-.18-.654-.48-.799-.264-.126-.552-.146-.817-.173-.264-.028-.502-.056-.639-.126-.122-.062-.181-.142-.181-.32 0-.41.34-.742.783-.745.421.016.666.26.783.622.107.339.615.175.504-.162-.152-.474-.5-.857-1.012-.959v-.295c0-.177-.132-.266-.264-.266zm2.645.265c-.355 0-.355.527 0 .53h4.763c.353 0 .353-.53 0-.53zm0 1.852c-.355 0-.355.53 0 .53h4.763c.352 0 .353-.53 0-.53zm0 1.852c-.355 0-.355.527 0 .527h4.763c.352 0 .352-.527 0-.527zM2.649 9.26c-.356 0-.356.537 0 .529h8.466c.352 0 .352-.53 0-.53zm0 1.852c-.356 0-.356.53 0 .53h8.466c.352 0 .352-.53 0-.53zm0 1.852c-.356 0-.356.529 0 .53h8.466c.352 0 .352-.53 0-.53z"
                        fill="#2576BC"
                    >
                    </path>
                </svg> */}
                <Eye />
            </button>
            <Modal show={show} onHide={handleClose} dialogClassName="request-leave width-40vw">
                <Modal.Header closeButton>
                    <Modal.Title>{filename}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="parent-div">
                        <h1 className="task-Tab-heading align-center  font-weight500  font-size-heading"><Modal.Title> File :</Modal.Title> </h1>
                        <h6 className="text-center">
                            {getFileNameFromLink(filesrc)}
                        </h6>
                        <br />
                        <div className="flex-row justify-center">
                            {/* <img className="bill-img" src={i.bill} alt={`Bill Image of ${i.item_name}`} /> */}
                            {isImage(filesrc) ? (
                                <img className="bill-img" src={`${IMAGE_URL}${filesrc}`} alt={`File/ Image of ${filename}`} />
                            ) : (
                                <a href={filesrc} target="_blank" rel="noreferrer">
                                    <AttachmentIcon source={filesrc} />
                                    Open Document
                                </a>
                            )}
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

const ViewChatImageorFile = ({ doc, textcss, filesrc, customCss }) => {

    const isImage = (url) => {
        return /\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/.test(url);
    }
    return (
        <>
            <div className={`${customCss ? customCss : 'flex-row justify-center'} `}>
                {isImage(filesrc) ? (
                    <a href={filesrc} target="_blank" rel="noopener noreferrer">
                        <img className="chat-photo" src={filesrc} alt={`File/ Image of ${getFileNameFromLink(filesrc)}`} />
                    </a>
                ) : (
                    <a href={filesrc} target="_blank" className={`${textcss ? textcss : ''}`} rel="noreferrer">
                        <AttachmentIcon source={filesrc} />
                        <br />
                        {getFileNameFromLink(filesrc)}
                    </a>
                )}
            </div>
        </>
    );
}

const ViewEmployeeList = ({ titlename, sort, list }) => {
    const [show, setShow] = useState(false);
    const [showemployee, setShowemployee] = useState(false);
    const [employeenumbershow, Setemployeenumbershow] = useState(3)
    const handleClose = () => setShow(false);
    const handleShow = () => {
        setShow(true);
    };

    const handleShowemployee = (empCode) => {
        setShowemployee(empCode);
    };

    return (
        <>
            <button
                title={"View List"}
                style={{ cursor: "pointer" }}
                onClick={handleShow}
            >
                <div className="overlap-image-div " style={{}}>
                    {list?.slice(0, employeenumbershow).map((i, index) => (
                        <>

                            <div className="outer-overlap-image-box" key={index} >
                                <div
                                    className="overlap-image-box"
                                    onMouseEnter={() => handleShowemployee(i.emp_code)}
                                    onMouseLeave={() => handleShowemployee(null)}
                                    style={{ transform: showemployee === i.emp_code ? "scale(1.2)" : "scale(0.9)" }}
                                >
                                    <CustomImageModal customStyle>
                                        {i.profilepic ? (
                                            <img
                                                src={`${i.profilepic}`}
                                                alt={`${i.name} pic`}
                                                className="profile-img overlap-img"
                                            />
                                        ) : (
                                            // <UserDefaultLogo
                                            //     user={{ name: i.name, profilepic: i.profilepic }}
                                            //     customStyleforParent={"reqOutDuty-default-logo-dashboard"} customStyleforChild={'small-profile-dashboard'}
                                            // />
                                            <div
                                                className={`small-profile-dashboard circle`}
                                                style={{
                                                    backgroundColor: backgroundColor,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: textColor,
                                                    height: '100%',
                                                    width: '100%'
                                                }}
                                            >
                                                {initials}
                                            </div>
                                        )}
                                    </CustomImageModal>
                                </div>
                                {showemployee === i.emp_code && (
                                    <div className="overlap-employee-details">
                                        {i.emp_code}
                                        <br />
                                        {i.name}
                                    </div>
                                )}
                            </div>
                        </>
                    ))}
                    {list && list.length > employeenumbershow && (
                        <div className="dots-container">
                            {Array.from({ length: Math.ceil((list.length - employeenumbershow) / 1) }).map((_, i) => (
                                <span key={i} className="dot"></span>
                            ))}
                        </div>
                    )}
                    {list && list.length > employeenumbershow && (
                        <div className="add-more-container">
                            <span className="add-more-text">+More</span>
                        </div>
                    )}

                </div>
            </button>

            <Modal
                show={show}
                onHide={handleClose}
                dialogClassName="request-leave width-40vw"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{titlename}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="parent-div">
                        <table className="table-css">
                            <thead>
                                <tr className="custom-table-head-invoices">
                                    <th className="align-center font-size-text font-weight600">
                                        Sr no.
                                    </th>
                                    <th className="align-center font-size-text font-weight600">
                                        Profile pic
                                    </th>
                                    <th className="align-center font-size-text font-weight600">
                                        Employee code
                                    </th>
                                    <th className="align-center font-size-text font-weight600">
                                        Employee Name
                                    </th>
                                </tr>{" "}
                            </thead>
                            <tbody>
                                {list?.map((i, index) => (
                                    <>
                                        <tr className="custom-table-head-td">
                                            <td className="align-left">{index + 1}</td>
                                            <td className="align-center">
                                                <CustomImageModal customStyle>
                                                    {i.profilepic ? (
                                                        <img
                                                            src={`${i.profilepic}`}
                                                            alt={`${i.name} pic`}
                                                            className="profile-img"
                                                        />
                                                    ) : (
                                                        <UserDefaultLogo
                                                            user={{ name: i.name, profilepic: i.profilepic }}
                                                            customStyleforParent={"reqOutDuty-default-logo-dashboard"} customStyleforChild={'small-profile-dashboard'}
                                                        />
                                                    )}
                                                </CustomImageModal>
                                            </td>
                                            <td className="align-center">{i.emp_code}</td>
                                            <td className="align-center">{i.name}</td>
                                        </tr>
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

const ShowBannerPopup = () => {

    const [show, setShow] = useState(localStorage.getItem("hasSeenPopup") === "true" ? true : false);
    const handleClose = () => {
        localStorage.setItem("hasSeenPopup", "false");
        setShow(false)
    };

    return (
        <>
            <Modal
                show={show}
                onHide={handleClose}
                dialogClassName="request-leave width-40vw"
            >
                <Modal.Header closeButton>
                    <Modal.Title>New Product Alert</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div style={{ textAlign: 'center' }}>
                        <h6>To view Newly Developed Software <strong>PMS (Project Management System)</strong></h6>
                        <h6>Members from Structure, Highway Department can</h6>
                        <a href="https://pms.aimantra.co/" target="_blank">Click here to login PMS Aimantra</a>
                    </div>

                </Modal.Body>
            </Modal>
        </>
    );
};



const ViewImprestRequestDates = ({ i }) => {

    return (
        <>
            <div title="Approval Dates" >
                {i.rh_leave_status === "approved" ?
                    <span
                        request-status={i.rh_leave_status}
                        className="request-status "
                    >
                        Rh ({i.rh_assigned}-{i.rh_assigned_name}) Approved
                        {i.rh_update_datetime ? <><br />At: {formatDateTime(i.rh_update_datetime).longfull}</> : ''}
                    </span>
                    : ""}
                <br />
                {i.admin_leave_status === "approved" ?
                    <span
                        request-status={i.admin_leave_status}
                        className="request-status "
                    >
                        {i.admin_update_by_user_role || 'Admin'} {i.admin_update_by ? `(${i.admin_update_by}-${i.admin_update_by_name})` : ''} Approved
                        {i.admin_update_datetime ? <><br />At: {formatDateTime(i.admin_update_datetime).longfull}</> : ''}
                    </span>
                    : ""}
                <br />
                {i.account_leave_status === "approved" ?
                    <span
                        request-status={i.account_leave_status}
                        className="request-status "
                    >
                        Accounts{i.account_update_by ? `(${i.account_update_by}-${i.account_update_by_name})` : ''} Approved
                        {i.account_update_datetime ? <><br />At: {formatDateTime(i.account_update_datetime).longfull}</> : ''}
                    </span>
                    : ""}
            </div>
        </>
    );
};

const ViewImprestRequestStatus = ({ i }) => {

    return (
        <div title="Status And Remarks">
            <span
                request-status={i.rh_leave_status}
                className="request-status"
                title={`${i.rh_leave_status === "rejected" ? `TL Reason For Rejection : \n${i.rejection_reason}` : ''}`}
            >
                {i.rh_leave_status === "pending"
                    ? "Pending For Rh Approval ⌛"
                    : i.rh_leave_status === "rejected"
                        ? <>Rh ✖,<br />Rh Reject Reason:<br />"{i.rejection_reason}"</>
                        : "Approved By Rh ✔,"}
            </span>
            <br />
            <span
                request-status={i.admin_leave_status}
                className="request-status"
                title={`${i.admin_leave_status === "rejected" ? `${i.admin_update_by_user_role || 'Admin'} Reason: ${i.admin_rejection_reason}` : ''}`}
            >
                {i.admin_leave_status === "rejected"
                    ? <>{i.admin_update_by_user_role || 'Admin'} ✖,<br />{i.admin_update_by_user_role || 'Admin'} Reject Reason: "{i.admin_rejection_reason}"</>
                    :
                    i.admin_leave_status === "pending"
                        ? "Pending For Admin Approval ⌛,"
                        :
                        i.admin_leave_status === "approved"
                            ? `Approved By ${i.admin_update_by_user_role || 'Admin'} ✔,`
                            : "Admin Status: " + i.admin_leave_status}
            </span>
            <br />
            <span
                request-status={i.account_leave_status}
                className="request-status"
                title={`${i.account_leave_status === "rejected" ? `Account Reason: ${i.account_rejection_reason}` : ''}`}
            >
                {i.account_leave_status === "rejected"
                    ? <>Accounts ✖,<br />Accounts Reject Reason:<br />"{i.account_rejection_reason}"</>
                    : i.account_leave_status === "pending"
                        ? "Pending For Account Approval ⌛"
                        :
                        i.account_leave_status === "approved"
                            ? "Approved By Accounts ✔,"
                            : "Accounts Status : " + i.account_leave_status}
            </span>
        </div>
    );
};

const ViewRequestRemarks = ({ i, table, approval_stages_data }) => {
    // console.log(approval_stages_data, table, approval_stages_data != null && approval_stages_data != undefined && approval_stages_data?.checker === true)
    return (
        <>
            <td title="Remarks and Approval Dates" className="table-body">
                {approval_stages_data != null && approval_stages_data != undefined && approval_stages_data?.checker ?
                    (
                        <>
                            <span
                                request-status={i.checker_approval_status}
                                className="request-status "
                            >
                                {/* {console.log(approval_stages_data.checker, 'checker')} */}
                                {i.checker_approval_status === "pending"
                                    ? "-"
                                    : i.checker_approval_status === "rejected"
                                        ? `Checker Reject Reason : ${i.checker_rejection_reason}`
                                        : `Checker${i.checker ? `(${i?.checker_name}) ` : ''}: Checked ${i.checker_update_datetime ? `At: ${formatDateTime(i.checker_update_datetime).date}` : ''}`}
                            </span>
                            <br />

                        </>
                    )
                    : (
                        <>
                            <span

                                className="request-status ">
                                Checker  Step was skipped
                            </span >
                            <br />
                        </>
                    )}

                {/* <span
                    request-status={i.checker_approval_status}
                    className="request-status "
                >
                    {i.checker_approval_status === "pending"
                        ? "-"
                        : i.checker_approval_status === "rejected"
                            ? `Checker Reject Reason : ${i.checker_rejection_reason}`
                            : `Checker${i.checker ? `(${i?.checker_name}) ` : ''}: Checked ${i.checker_update_datetime ? `At: ${formatDateTime(i.checker_update_datetime).date}` : ''}`}
                </span>
                <br /> */}
                {/* <br /> */}

                {approval_stages_data != null && approval_stages_data != undefined && approval_stages_data.authority ? (
                    <>
                        <span
                            request-status={i.authority_approval_status}
                            className="request-status "
                        >
                            {/* {console.log(approval_stages_data.authority, 'authority', i.authority_approval_status)} */}
                            {i.authority_approval_status === "pending"
                                ? "-"
                                : i.authority_approval_status === "rejected"
                                    ? `Authority Reject Reason : ${i.authority_rejection_reason}`
                                    : `Authority${i.authority_engineer ? `(${i?.authority_engineer_name}) ` : ''}: Verified Amounts for Bills ${i.authority_update_datetime ? `At: ${formatDateTime(i.authority_update_datetime).date}` : ''}`}
                        </span>
                        <br />
                    </>
                ) : (
                    <>
                        <span

                            className="request-status ">
                            Authority  Step was skipped
                        </span >
                        <br />
                    </>
                )}

                {/* <br /> */}

                {approval_stages_data != null && approval_stages_data != undefined && approval_stages_data.account ? (<>
                    <span
                        request-status={i.account_status_a}
                        className="request-status "
                    >
                        {i.account_status_a === "pending"
                            ? "-"
                            : i.account_status_a === "rejected"
                                ? `Accounts Reject Reason : ${i.account1_rejection_reason}`
                                : `Accounts${i.account_update_by ? `(${i?.account_update_by_name}) ` : ''}: Bills Verified ${i.account_update_datetime ? `At: ${formatDateTime(i.account_update_datetime).date}` : ''}`}
                    </span>
                    <br />
                </>) : (
                    <>
                        <span

                            className="request-status ">
                            Account1  Step was skipped
                        </span >
                        <br />
                    </>
                )}

                {/* <br /> */}

                {approval_stages_data != null && approval_stages_data != undefined && approval_stages_data.admin1 ? (<>
                    <span
                        request-status={i.admin_approval_status_c1}
                        className="request-status "
                        title={i.admin_approval_status_c1 === "rejected" ? `Admin 1 Reject Reason : ${i.admin_rejection_reason_c1}` : ""}
                    >
                        {i.admin_approval_status_c1 === "pending"
                            ? "-"
                            : i.admin_approval_status_c1 === "rejected"
                                ? `Admin 1 Rejection Reason : ${i.admin_rejection_reason_c1}`
                                : `Admin 1${i.admin_update_by_c1 ? `(${i?.admin_update_by_c1_name ? i?.admin_update_by_c1_name : ""}) ` : ''}: Approved After Verification  ${i.admin_update_datetime_c1 ? `At: ${formatDateTime(i.admin_update_datetime_c1).date}` : ''}`}
                    </span>
                    <br />
                </>) : (
                    <>
                        <span

                            className="request-status ">
                            Admin1  Step was skipped
                        </span >
                        <br />
                    </>
                )}

                {approval_stages_data != null && approval_stages_data != undefined && approval_stages_data.admin2 ? (<>
                    <span
                        request-status={i.admin_approval_status_c2}
                        className="request-status "
                        title={i.admin_approval_status_c2 === "rejected" ? `Admin 2 Reject Reason : ${i.admin_rejection_reason_c2}` : ""}
                    >
                        {i.admin_approval_status_c2 === "pending"
                            ? "-"
                            : i.admin_approval_status_c2 === "rejected"
                                ? `Admin 2 Rejection Reason : ${i.admin_rejection_reason_c2}`
                                : `Admin 2${i.admin_update_by_c2 ? `(${(i?.admin_update_by_c2_name || i.admin_update_by_name_c2) ? (i?.admin_update_by_c2_name || i.admin_update_by_name_c2) : ""}) ` : ''}: Approved After Verification  ${i.admin_update_datetime_c2 ? `At: ${formatDateTime(i.admin_update_datetime_c2).date}` : ''}`}
                    </span>
                    {/* <br />
                <span
                    request-status={i.admin_approval_status_c3}
                    className="request-status "
                    title={i.admin_approval_status_c3 === "rejected" ? `Admin 3 Reject Reason : ${i.admin_rejection_reason_c3}` : ""}
                >
                    {i.admin_approval_status_c3 === "pending"
                        ? "-"
                        : i.admin_approval_status_c3 === "rejected"
                            ? `Admin 3 Rejection Reason : ${i.admin_rejection_reason_c3}`
                            : `Admin 3${i.admin_update_by_c3 ? `(${i.admin_update_by_c3}) ` : ''}: Approved After Verification  ${i.admin_update_datetime_c3 ? `At: ${formatDateTime(i.admin_update_datetime_c3).date}` : ''}`}
                </span> */}
                    <br />
                </>) : (
                    <>
                        <span

                            className="request-status ">
                            Admin2  Step was skipped
                        </span >
                        <br />
                    </>
                )}

                {approval_stages_data != null && approval_stages_data != undefined && approval_stages_data.admin3 ? (<>
                    <span
                        request-status={i.admin_approval_status_c3}
                        className="request-status "
                        title={i.admin_approval_status_c3 === "rejected" ? `Admin 3 Reject Reason : ${i.admin_rejection_reason_c3}` : ""}
                    >
                        {i.admin_approval_status_c3 === "pending"
                            ? "-"
                            : i.admin_approval_status_c3 === "rejected"
                                ? `Admin 3 Rejection Reason : ${i.admin_rejection_reason_c3}`
                                : `Admin 3${i.admin_update_by_c3 ? `(${i?.admin_update_by_c3_name ? i?.admin_update_by_c3_name : ""}) ` : ''}: Approved After Verification  ${i.admin_update_datetime_c3 ? `At: ${formatDateTime(i.admin_update_datetime_c3).date}` : ''}`}
                    </span>
                    {/* <br />
                <span
                    request-status={i.admin_approval_status_c3}
                    className="request-status "
                    title={i.admin_approval_status_c3 === "rejected" ? `Admin 3 Reject Reason : ${i.admin_rejection_reason_c3}` : ""}
                >
                    {i.admin_approval_status_c3 === "pending"
                        ? "-"
                        : i.admin_approval_status_c3 === "rejected"
                            ? `Admin 3 Rejection Reason : ${i.admin_rejection_reason_c3}`
                            : `Admin 3${i.admin_update_by_c3 ? `(${i.admin_update_by_c3}) ` : ''}: Approved After Verification  ${i.admin_update_datetime_c3 ? `At: ${formatDateTime(i.admin_update_datetime_c3).date}` : ''}`}
                </span> */}
                    <br />
                </>) : (
                    <>
                        <span

                            className="request-status ">
                            Admin3  Step was skipped
                        </span >
                        <br />
                    </>
                )}
                {approval_stages_data != null && approval_stages_data != undefined && approval_stages_data.payment_settlement ? (<>
                    <span
                        request-status={i.account_status_b}
                        className="request-status "
                        style={{ cursor: "help" }}
                        title={`Transaction/Cheque No.:\n${i.account_status_b !== "pending" ? i.settlement_transaction_id : null}`}
                    >

                        {i.account_status_b === "pending" ? (
                            "-"
                        ) : i.account_status_b === "rejected" ? (
                            `Final Rejection Reason: ${i.account2_rejection_reason}`
                        ) : (
                            <>
                                {`Final1${i.final_update_by ? ` (${i.final_update_by_name})` : ''}: Approved And Settled `}
                                {i.final_update_datetime ? `At: ${formatDateTime(i.final_update_datetime).date} ` : ''}
                                {i.settlement_bill ? (
                                    <a
                                        title="View Settlement Bill"
                                        className="modal-button-black"
                                        href={i.settlement_bill}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View
                                    </a>
                                ) : "No Proof Attached"}
                            </>
                        )}


                        {/* {console.log(i.settlement_bill, 'settlememnt bill')} */}
                    </span>
                </>) : (
                    <>
                        <span

                            className="request-status ">
                            Account2  Step was skipped
                        </span >
                        <br />
                    </>
                )}


            </td>
        </>
    )
}

// allows one empty
const DateRangePicker = ({ startDate, endDate, onChange, placeHolder1, placeHolder2 }) => {
    const [dates, setDates] = useState([null, null]);

    useEffect(() => {
        const start = startDate && startDate !== "null" ? dayjs(startDate) : null;
        const end = endDate && endDate !== "null" ? dayjs(endDate) : null;
        setDates([start, end]);
    }, [startDate, endDate]);

    const handleCalendarChange = (values) => {
        if (!values) return;
        setDates(values);

        const start = values[0] ? values[0].format("YYYY-MM-DD") : null;
        const end = values[1] ? values[1].format("YYYY-MM-DD") : null;

        onChange(start, end);
    };

    const handleChange = (values) => {
        if (!values || values.length === 0) {
            setDates([null, null]);
            onChange(null, null);
        }
    };

    return (
        <Space direction="vertical" size={12} style={{ color: "#707070" }}>
            <RangePicker
                value={dates}
                placeholder={[placeHolder1, placeHolder2]}
                onCalendarChange={handleCalendarChange} // partial selection
                onChange={handleChange} // full clear or both selected
                className="custom-range-picker"
            />
        </Space>
    );
};

const DoubleDateRangePicker = ({ startDate, endDate, onChange, placeHolder1, placeHolder2 }) => {
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);

    // Sync with incoming props
    useEffect(() => {
        setStart(startDate && startDate !== "null" ? dayjs(startDate) : null);
        setEnd(endDate && endDate !== "null" ? dayjs(endDate) : null);
    }, [startDate, endDate]);

    const handleStartChange = (value) => {
        setStart(value);
        onChange(
            value ? value.format("YYYY-MM-DD") : null,
            end ? end.format("YYYY-MM-DD") : null
        );
    };

    const handleEndChange = (value) => {
        setEnd(value);
        onChange(
            start ? start.format("YYYY-MM-DD") : null,
            value ? value.format("YYYY-MM-DD") : null
        );
    };

    return (
        <Space>
            <DatePicker
                value={start}
                placeholder={placeHolder1}
                onChange={handleStartChange}
                className="custom-date-picker"
            />
            <DatePicker
                value={end}
                placeholder={placeHolder2}
                onChange={handleEndChange}
                className="custom-date-picker"
            />
        </Space>
    );
};

// Not tested
const MonthRangePicker = ({ startDate, endDate, onChange, placeHolder1, placeHolder2 }) => {
    const [dates, setDates] = useState([null, null]);

    useEffect(() => {
        const start = startDate && startDate !== "null" ? dayjs(startDate) : null;
        const end = endDate && endDate !== "null" ? dayjs(endDate) : null;
        setDates([start, end]);
    }, [startDate, endDate]);

    const handleCalendarChange = (values) => {
        if (!values) return;
        setDates(values);

        const start = values[0] ? values[0].format("YYYY-MM") : null;
        const end = values[1] ? values[1].format("YYYY-MM") : null;

        onChange(start, end);
    };

    const handleChange = (values) => {
        if (!values || values.length === 0) {
            setDates([null, null]);
            onChange(null, null);
        }
    };

    return (
        <div className='salary-history-data-type-toggle'>
            <Space direction="vertical" size={12} style={{ color: "#707070" }}>
                <RangePicker
                    picker="month"
                    value={dates}
                    placeholder={[placeHolder1, placeHolder2]}
                    onCalendarChange={handleCalendarChange}
                    onChange={handleChange}
                    className="custom-range-picker"
                />
            </Space>
        </div>
    );
};

// Not tested
const DoubleMonthRangePicker = ({ startDate, endDate, onChange, placeHolder1, placeHolder2 }) => {
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);

    // Sync with incoming props
    useEffect(() => {
        setStart(startDate && startDate !== "null" ? dayjs(startDate) : null);
        setEnd(endDate && endDate !== "null" ? dayjs(endDate) : null);
    }, [startDate, endDate]);

    const handleStartChange = (value) => {
        setStart(value);
        onChange(
            value ? value.format("YYYY-MM") : null,
            end ? end.format("YYYY-MM") : null
        );
    };

    const handleEndChange = (value) => {
        setEnd(value);
        onChange(
            start ? start.format("YYYY-MM") : null,
            value ? value.format("YYYY-MM") : null
        );
    };

    return (
        <Space>
            <DatePicker
                picker="month"
                value={start}
                placeholder={placeHolder1}
                onChange={handleStartChange}
                className="custom-date-picker"
            />
            <DatePicker
                picker="month"
                value={end}
                placeholder={placeHolder2}
                onChange={handleEndChange}
                className="custom-date-picker"
            />
        </Space>
    );
};

const DownloadBulkDocumentsAsZip = ({ emp_code, emp_name, employeeDocuments, document_list, doc_name_key, doc_file_key, downloadBlueButton = false }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState();
    const [show, setShow] = useState(false);
    const [documentList, setDocumentList] = useState([]);
    const handleShow = () => {
        setDocumentList(document_list);
        setShow(true);
    }
    const handleClose = () => {
        setShow(false);
    }

    const fetchAndZipFiles = async () => {
        setLoading(true); // loading logic
        const loadingToastId = toast.loading("Loading: Please wait..."); // toast logic
        setError("");

        try {
            // Step 1: Fetch the API response

            const apiResponse = documentList; // Assuming API response is JSON
            // const files = apiResponse.flatMap((data) => data.documents);
            const files = apiResponse;

            if (files.length === 0) {
                setError("No documents found in the API response.");
                setLoading(false);
                return;
            }

            // Step 3: Initialize JSZip
            const zip = new JSZip();

            // Step 4: Fetch each document and add it to the ZIP
            const filePromises = files.map(async (file) => {
                try {
                    const fileUrl = file[doc_file_key];
                    const finalUrl = fileUrl.startsWith("http") ? fileUrl : `${IMAGE_URL}${fileUrl}`;

                    const fileResponse = await axios.get(finalUrl, {
                        responseType: "blob",
                    });

                    // Extract the extension from the URL or Content-Type header
                    let extension = "";
                    const urlParts = finalUrl.split(".");
                    if (urlParts.length > 1) {
                        extension = urlParts[urlParts.length - 1].split("?")[0]; // handles URLs with query params
                    }

                    // Fallback to "file" if name is missing
                    const baseFileName = file[doc_name_key] || "file";

                    const fileName = `${baseFileName}.${extension || "bin"}`; // fallback to .bin

                    // const fileName = `${file[doc_name_key]}.pdf`;
                    zip.file(fileName, fileResponse.data);
                } catch (err) {
                    console.error(`Failed to download: ${file[doc_name_key]}`, err);
                }
            });

            await Promise.all(filePromises);

            // Step 5: Generate and save the ZIP file
            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `${emp_code}-${emp_name}-Documents.zip`);


            // Close the modal and show success toast
            handleClose();
            toast.dismiss(loadingToastId);
            toast.success("Documents downloaded successfully!");
        } catch (err) {
            console.error("Error fetching data or downloading files:", err);
            setError("Failed to process the request. Please try again.");
        } finally {
            setLoading(false);
            toast.dismiss(loadingToastId);
        }
    };

    return (
        <>

            <button
                title="Download All Documents"
                onClick={handleShow}
                className={` model-button-black flex-row justify-evenly model-button-black-p ${downloadBlueButton ? 'model-button-blue-p ' : 'model-button'}`}
            >
                <Download color={downloadBlueButton ? 'blue' : 'black'} />
            </button>
            <Modal
                show={show}
                onHide={handleClose}
                dialogClassName="request-leave"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Download Documents</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <div>
                            <table className="table-css">
                                <thead>
                                    <tr className="custom-table-head-tr">
                                        <th className="align-left">S. No.</th>
                                        <th className="align-center">Name</th>
                                        <th className="align-center">File</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documentList.map((i, docIndex) => {
                                        return (
                                            <React.Fragment key={docIndex}>
                                                <tr className="custom-table-head-td">
                                                    <td className="align-left">{docIndex + 1}</td>
                                                    <td className="align-center">{(i[doc_name_key] || i?.doc_name) ? (i[doc_name_key] || i?.doc_name) : '-'}</td>
                                                    { }
                                                    <td className="align-center">
                                                        {(i?.doc_file || i[doc_file_key]) ? (
                                                            i?.doc_file ? (
                                                                Object.keys(i?.doc_file).length > 0 ? (
                                                                    (() => {
                                                                        const fileSrc =
                                                                            typeof i.doc_file === "string" && i.doc_file.startsWith("http")
                                                                                ? i.doc_file
                                                                                : `${IMAGE_URL}${i.doc_file}`;

                                                                        return (
                                                                            <a href={fileSrc} target="_blank" rel="noopener noreferrer">
                                                                                <AttachmentIcon source={fileSrc} />
                                                                            </a>
                                                                        );
                                                                    })()
                                                                ) : (
                                                                    "Document Not Attached"
                                                                )
                                                            ) : i[doc_file_key] ? (
                                                                (() => {
                                                                    const fileSrc = i[doc_file_key].startsWith("http")
                                                                        ? i[doc_file_key]
                                                                        : `${IMAGE_URL}${i[doc_file_key]}`;
                                                                    return (
                                                                        <a href={fileSrc} target="_blank" rel="noopener noreferrer">
                                                                            <AttachmentIcon source={fileSrc} />
                                                                        </a>
                                                                    );
                                                                })()
                                                            ) : (
                                                                "Document Not Attached"
                                                            )
                                                        ) : (
                                                            "Document Not Attached"
                                                        )}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className='button-models' >
                            <button
                                className="model-button   model-button-cancel font-weight500"
                                onClick={handleClose}
                            >
                                Cancel
                            </button>
                            <button onClick={fetchAndZipFiles} disabled={loading} className="model-button   font-weight500    model-button-submit">
                                {loading ? "Downloading..." :
                                    <><Download /> Documents</>
                                }
                            </button>
                        </div>
                        {error && <p style={{ color: "red" }}>{error}</p>}
                    </div>
                </Modal.Body>
            </Modal>
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
        </>
    );
};

const getNumberSuffix = (number) => {
    const mod100 = number % 100;
    if (mod100 >= 11 && mod100 <= 13) {
        return "th";
    }
    const lastDigit = number % 10;
    switch (lastDigit) {
        case 1:
            return "st";
        case 2:
            return "nd";
        case 3:
            return "rd";
        default:
            return "th";
    }
};

const generateCustomFileForUpload = (originalFile, prefix = 'Aimantra') => {

    if (!originalFile || !originalFile.name) {
        throw new Error("Invalid file provided");
    }

    const symbols = '!@#$%^&*()_-+=';
    const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const allChars = symbols + lowercaseLetters + uppercaseLetters + numbers;

    const now = new Date();
    const date = now.toLocaleDateString('en-GB').split('/').reverse().join('-'); // YYYY-MM-DD
    const time = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-'); // HH-MM-SS

    let randomCode = '';
    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * allChars.length);
        randomCode += allChars[randomIndex];
    }
    const customFile = new File([originalFile], `${prefix}_${date}_${time}_${randomCode}_${originalFile.name}`, { type: originalFile.type });
    return customFile;
}

const generateCustomKey = (prefix = 'Aimantra') => {


    const symbols = '!@#$%^&*()_-+=';
    const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const allChars = symbols + lowercaseLetters + uppercaseLetters + numbers;

    const now = new Date();
    const date = now.toLocaleDateString('en-GB').split('/').reverse().join('-'); // YYYY-MM-DD
    const time = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '-'); // HH-MM-SS

    let randomCode = '';
    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * allChars.length);
        randomCode += allChars[randomIndex];
    }
    const customPassKey = (`${prefix}_${date}_${time}_${randomCode}_`);
    return customPassKey;
}

const CustomTooltipOld = ({ children, tooltipContent, position = 'top', customStyle = {} }) => {
    const [show, setShow] = useState(false);

    return (
        <div
            className="custom-tooltip-wrapper"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            style={{ display: 'inline-block', position: 'relative' }}
        >
            {children}
            {show && (
                <div className={`custom-tooltip-box custom-tooltip-${position}`} style={customStyle}>
                    {tooltipContent}
                </div>
            )}
        </div>

    )
}

const CustomTooltip = ({
    children,
    tooltipContent,
    position = "top",
    customStyle = {},
}) => {
    const [show, setShow] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [finalPosition, setFinalPosition] = useState(position);

    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);

    useLayoutEffect(() => {
        if (!show || !triggerRef.current || !tooltipRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();

        const gap = 8;

        const spaceTop = rect.top;
        const spaceBottom = window.innerHeight - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = window.innerWidth - rect.right;

        let newPosition = position;

        // ---- SMART SIDE SWITCHING ----
        if (position === "top" && spaceTop < tooltipRect.height) {
            newPosition = "bottom";
        }

        if (position === "bottom" && spaceBottom < tooltipRect.height) {
            newPosition = "top";
        }

        if (position === "left" && spaceLeft < tooltipRect.width) {
            newPosition = "right";
        }

        if (position === "right" && spaceRight < tooltipRect.width) {
            newPosition = "left";
        }

        let top = 0;
        let left = 0;

        // ---- POSITION CALCULATION (POSITION DOMINATES) ----
        switch (newPosition) {
            case "top":
                top = rect.top - tooltipRect.height - gap;
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                break;

            case "bottom":
                top = rect.bottom + gap;
                left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                break;

            case "left":
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                left = rect.left - tooltipRect.width - gap;
                break;

            case "right":
                top = rect.top + rect.height / 2 - tooltipRect.height / 2;
                left = rect.right + gap;
                break;

            default:
                break;
        }

        // ---- CLAMP TOOLTIP INSIDE VIEWPORT ----
        const margin = 8;

        const maxTop = window.innerHeight - tooltipRect.height - margin;
        const maxLeft = window.innerWidth - tooltipRect.width - margin;

        top = Math.max(margin, Math.min(top, maxTop));
        left = Math.max(margin, Math.min(left, maxLeft));

        setFinalPosition(newPosition);
        setCoords({ top, left });
    }, [show, position]);

    return (
        <>
            <span
                ref={triggerRef}
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                // onMouseLeave={(e) => {
                //     if (!tooltipRef.current?.contains(e.relatedTarget)) {
                //         setShow(false);
                //     }
                // }}
                style={{ cursor: "pointer" }}
            >
                {children}
            </span>

            {show &&
                createPortal(
                    <div
                        ref={tooltipRef}
                        className="custom-tooltip-box"
                        style={{
                            position: "fixed",
                            top: coords.top,
                            left: coords.left,
                            zIndex: 9999,

                            // responsive size
                            // maxWidth: "min(40vw, 400px)",
                            maxWidth: "90vw",
                            maxHeight: "70vh",
                            // overflow: "auto",

                            ...customStyle,
                        }}
                    >
                        {tooltipContent}
                    </div>,
                    document.body
                )
            }
        </>
    );
};

const CustomImageModal = ({ customStyle, children }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const openModal = (url) => {
        setSelectedImage(url);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedImage(null);
    };

    const clonedChild = children && React.cloneElement(children, {
        onClick: () => {
            if (children.props.src) openModal(children.props.src);
        },
        style: { cursor: 'pointer' },
    });

    const modalContent = modalOpen && selectedImage ? (
        <div
            className={`${customStyle ? 'profile-modal-overlay-back-dashboard' : 'profile-modal-overlay-back'} profile-modal-overlay`}
            onClick={closeModal}
        >
            <img
                src={selectedImage}
                alt="Profile Full View"
                className="profile-modal-image"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    ) : null;
    return (
        <>
            {clonedChild}
            {ReactDOM.createPortal(modalContent, document.body)}
        </>
    );
};





const UserProfileModal = ({
    code,
    name,
    profilepic,
    dateText,
}) => {
    if (!code && !name) return null;

    return (
        <div className="d-flex align-items-center gap-2 flex-column">
            <CustomImageModal customStyle>
                {profilepic ? (
                    <img
                        src={`${IMAGE_URL}${profilepic}`}
                        alt="profile"
                        className="profile-img"
                    />
                ) : (
                    <UserDefaultLogo
                        user={{ name, profilepic: profilepic }}
                        customStyleforParent="reqOutDuty-default-logo-dashboard"
                        customStyleforChild="small-profile"
                    />
                )}
            </CustomImageModal>

            <div className="text-center">
                <p className="mb-0">{`${code} - ${name}`}</p>
                {dateText && <small>{dateText}</small>}
            </div>
        </div>
    );
};


const ViewDynamicApprovalDates = ({ dynamic_approval }) => {
    if (!Array.isArray(dynamic_approval)) {
        return <td className="table-body">No Status Available</td>;
    }
    return (
        <td title="Approval Dates" className="table-body">
            {dynamic_approval.map((i, index) => (
                <div request-status={i.approval_status} className="request-status " key={index}>
                    {i.approval_status === "approved" ?
                        <div
                        // request-status={i.approval_status}
                        // className="request-status "
                        >
                            {i.employee ? (i.role ? `${i.employee?.name}(${i.role})` : `${i.employee?.name}`) : i.role} Approved
                            {i.updated_at ? <><br />At: {formatDateTime(i.updated_at).date}</> : ''}
                        </div>
                        // </div>
                        : "-"}
                </div>
            ))}
        </td>

    );
};

const ViewDynamicApprovalStatus = ({ dynamic_approval, Table }) => {
    console.log(dynamic_approval, "dynnamic_approval");

    if (!Array.isArray(dynamic_approval)) {
        if (dynamic_approval == 'skipped')
            return <td request-status={'approved'} className="table-body request-status">Direct Approval</td>;
        // return <td className="table-body">Direct Approval</td>;
        else
            return <td className="table-body">No Status Available</td>;
    }
    return (
        <td title="Status" className="table-body">
            {dynamic_approval.map((i, index) => (
                <div request-status={i.approval_status} className="request-status" key={index}>
                    {i.approval_status === "pending" ?
                        `Pending For ${i.employee ? (i.role ? `${i.emp_name}(${i.role})` : `${i.emp_name}`) : i.role} Approval ⌛`
                        : i.approval_status === "rejected"
                            ? `${i.employee ? (i.role ? `${i.emp_name}(${i.role})` : `${i.emp_name}`) : i.role} ✖`
                            : `${i.employee ? (i.role ? `${i.emp_name}(${i.role})` : `${i.emp_name}`) : i.role} ✔`}
                </div>
            ))}
        </td>

    );
};

const ViewDynamicApprovalRemarks = ({ dynamic_approval }) => {

    // if (!Array.isArray(dynamic_approval)) {
    //     return <td className="table-body">No Status Available</td>;
    // }
    if (!Array.isArray(dynamic_approval)) {
        if (dynamic_approval == 'skipped')
            return <td request-status={'approved'} className="table-body request-status">Direct Approval</td>;
        else
            return <td className="table-body">No Status Available</td>;
    }
    return (
        <td title="Remarks" className="table-body">
            {dynamic_approval.map((i, index) => (
                <div
                    request-status={i.approval_status}
                    className="request-status"
                    key={index}
                    style={{ marginBottom: "6px" }}
                >
                    {i.approval_status === "pending" ? (
                        "-"
                    ) : (
                        <div className='flex-row justify-between alignment-start'>
                            <span className=''>
                                {i.updated_by_name
                                    ? `${i.updated_by_name}${i.role ? ` (${i.role}): ` : ""}`
                                    : i.role || "Unknown"}{" "}
                            </span>
                            <div className='align-right'>{i.updated_at
                                ? `Checked At ${formatDateTime(i.updated_at).date}`
                                : ""}
                                <br />
                                {i.approval_status === "rejected" ? 'Reject Reason' : (i.remarks && 'Edit Remarks')} {i.remarks && `: ${i.remarks}`}
                            </div>
                        </div>
                    )}
                </div>
            ))
            }
        </td >
    );
};

const ViewDocumnetsbilling = ({ documentlist }) => {
    return (<>

        {
            documentlist != undefined && documentlist.length > 0 &&
            <table className="table-css documentlistbillingtable">
                <thead>
                    <tr className="custom-table-head-tr ">
                        <th className="table-heading-text">S.No.</th>
                        <th className="table-heading-text">Document Name</th>

                        <th className="table-heading-text">Document Type</th>

                        <th className="table-heading-text text-center">Document</th>
                    </tr>
                </thead>
                <tbody
                >
                    {
                        documentlist
                            .map((doc, docIndex) => (
                                <tr className="custom-table-head-td">

                                    <td className="table-body">{docIndex + 1}.</td>
                                    <td className="table-body">{doc.document_name}</td>
                                    <td className="table-body">{doc.document_type}</td>
                                    <td className="table-body">
                                        {doc.document_file ? (
                                            // <a href={i.document_file} target="blank">
                                            //   View
                                            // </a>
                                            <a href={doc.document_file} target="blank">
                                                <div className="flex-row justify-center">
                                                    <AttachmentIcon source={doc.document_file} />
                                                </div>
                                            </a>
                                        ) : (
                                            "Document Not Attached"
                                        )}
                                    </td>


                                </tr>
                            ))
                    }
                </tbody>
            </table>
        }

    </>)
}

const ButtonVariants = ({
    buttonDisplay,
    buttonDisplayName,
    buttonDisplayNameColor,
    buttonDisplayTitle,
    handleShow,
}) => {
    const baseProps = {
        type: "button",
        onClick: handleShow,
        title: buttonDisplayTitle || buttonDisplayName || "View",
    };

    const buttonTypes = {
        "Eye": (
            <button {...baseProps}>
                <Eye />
            </button>
        ),
        "Name": (
            <button
                {...baseProps}
                style={{ paddingLeft: "5px", color: buttonDisplayNameColor ? buttonDisplayNameColor : "#2576bc", fontSize: "14px" }}
            >
                {buttonDisplayName || "View"}
            </button>
        ),
        "Eye-Name": (
            <button
                {...baseProps}
                style={{ paddingLeft: "5px", color: buttonDisplayNameColor ? buttonDisplayNameColor : "#2576bc", fontSize: "14px" }}
            >
                <Eye /> {buttonDisplayName || "View"}
            </button>
        ),
        "BlueEye": (
            <button {...baseProps}>
                <Eye className="text-blue-600" />
            </button>
        ),
        "BlueEye-Name": (
            <button
                {...baseProps}
                style={{ paddingLeft: "5px", color: buttonDisplayNameColor ? buttonDisplayNameColor : "#2576bc", fontSize: "14px" }}
            >
                <Eye className="text-blue-600" /> {buttonDisplayName || "View"}
            </button>
        ),
        "Model-Eye": (
            <button {...baseProps} className="model-button model-button-cancel">
                <Eye />
            </button>
        ),
        "Model-Name": (
            <button {...baseProps} className="model-button model-button-cancel">
                {buttonDisplayName || "View"}
            </button>
        ),
        "Model-Eye-Name": (
            <button {...baseProps} className="model-button model-button-cancel">
                <Eye /> {buttonDisplayName || "View"}
            </button>
        ),
    };

    return (
        buttonTypes[buttonDisplay] || (
            <button {...baseProps} className="model-button model-button-cancel">
                <Eye /> {buttonDisplayName || "Preview"}
            </button>
        )
    );
};


const AttachmentIcon = ({ source }) => {
    const ext = getFileExtension(source);

    if (isImage(source)) return <ImageIcon />;

    switch (ext) {
        case "pdf":
            return <File />
        case "doc":
        case "docx":
            return <FileText />
        case "xls":
        case "xlsx":
            return <Table />
        case "mp4":
        case "avi":
        case "mov":
        case "mkv":
            return <FileVideoCamera />
        default:
            return <div title={source}>
                <FileText />
            </div>
    }
};

// link click issue
// const renderDangerousHTMLBackup = (desc) => {
//     if (!desc) return null;

//     const linkRegex = /((https?|ftp):\/\/[^\s]+)/g;
//     const enhancedDesc = desc.replace(linkRegex, (url) => {
//         return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
//     });

//     return (
//         <div
//             className="ql-editor"
//             style={{ wordWrap: "break-word" }}
//             dangerouslySetInnerHTML={{ __html: enhancedDesc }}
//         />
//     );
// };

const renderDangerousHTML = (desc) => {
    if (!desc) return null;
    // Remove wrapping <p> and </p> if they exist
    const cleaned = desc.replace(/^<p>(.*)<\/p>$/i, "$1");
    // Auto-link URLs inside
    const linkRegex = /((https?|ftp):\/\/[^\s<]+)/g;
    const withLinks = cleaned.replace(linkRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
    return (
        <div
            className="ql-editor"
            style={{ wordWrap: "break-word", textAlign: 'end' }}
            dangerouslySetInnerHTML={{ __html: withLinks }}
        />
    );
};

const FormatKey = (key) => key.replace(/_/g, ' ');

function ReorderList(prevItems, index, newPosition, key) {
    // prevItems : list with current/previous positions 
    // index : current position
    // newPosition : new position
    // key : key name used for order (eg. sorting_var, order)

    const updated = [...prevItems];
    const oldPosition = parseInt(updated[index][key]);

    if (newPosition === oldPosition) return updated;

    // Update the moved item
    updated[index] = {
        ...updated[index],
        [key]: newPosition.toString(),
    };

    if (newPosition < oldPosition) {
        // Moving upward
        updated.forEach((item, i) => {
            const pos = parseInt(item[key]);
            if (i !== index && pos >= newPosition && pos < oldPosition) {
                item[key] = (pos + 1).toString();
            }
        });
    } else {
        // Moving downward
        updated.forEach((item, i) => {
            const pos = parseInt(item[key]);
            if (i !== index && pos > oldPosition && pos <= newPosition) {
                item[key] = (pos - 1).toString();
            }
        });
    }

    // Normalize all positions to be sequential (1,2,3,...)
    const sorted = [...updated].sort(
        (a, b) => parseInt(a[key]) - parseInt(b[key])
    );
    sorted.forEach((item, i) => {
        item[key] = (i + 1).toString();
    });

    return sorted;
}


const getFileNameFromUrl = (url) => {
    const urlParts = url.split("/");
    return urlParts[urlParts.length - 1].split("?")[0];
};


const isValidTwoDecimalNumber = (value) => {
    const regex = /^\d*\.?\d{0,2}$/;
    return regex.test(value) || value === "";
};
const truncateToTwoDecimals = (value) => {
    if (!value) return value;
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    return num.toFixed(2);
};


const getCurrentFinancialYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    const fyStart = month >= 4 ? year : year - 1;
    const fyEnd = fyStart + 1;

    return {
        start: `${fyStart}-04-01`,
        end: `${fyEnd}-03-31`,
        label: `${fyStart}-${fyEnd}`
    };
};

const calculateDaysFromDateList = (dateList = []) => {
    if (!Array.isArray(dateList) || dateList.length === 0) return 0;

    const uniqueDates = [...new Set(dateList)];

    return uniqueDates.length;
};


// Counts days between selected start & end dates 
const calculateDaysBetween = (start, end) => {
    if (!start || !end) return 0;

    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");

    if (endDate < startDate) return 0;

    return Math.floor(
        (endDate - startDate) / (1000 * 60 * 60 * 24)
    ) + 1;
};

//remove underscore and make capitalize
const formatFieldName = (field) => {
    if (!field) return null;

    return field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};



const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case "pending":
            return "text-warning-color";
        case "approved":
            return "text-success-color";
        case "rejected":
            return "text-danger-color";
        default:
            return "";
    }
};

//convert month into actual date , here monthvalue = "2025-04" and type = start/end
const getMonthBoundaryDate = (monthValue, type) => {
    if (!monthValue) return "";

    const [year, month] = monthValue.split("-");
    const date = new Date(year, month - 1, 1);
    if (type === "end") {
        date.setMonth(date.getMonth() + 1); //month always start from 0 like jan=0, feb=1
        date.setDate(0); //return last day of previous month
    }

    // format yyyy-mm-dd in local time
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const formatCurrency = (amount) => {
    return parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};


export {
    handleErrorToast,
    handleAllError,
    getMonthName,
    formatMonthYear,
    getMonthNameFromDate,

    calculateTotal,
    getProgressColor,
    formatRoundoff,
    formatRoundoffComplete,
    formatRoundoffCompleteNoComma,
    formatRoundoff2D,
    formatRoundoff3D,
    formatRoundoffCrores,
    formatCurrencyIndian,
    formatExcelToJson,
    sortProjects,
    customSortByKey,
    downloadAsExcel,
    inputMinLimit,
    inputMaxLimit,
    getFileNameFromLink,
    ViewFile,
    ViewOtherFile,
    ViewChatImageorFile,
    ViewEmployeeList,
    ShowBannerPopup,
    ViewImprestRequestDates,
    ViewImprestRequestStatus,

    DateRangePicker,
    DoubleDateRangePicker,

    MonthRangePicker,
    DoubleMonthRangePicker,

    DownloadBulkDocumentsAsZip,
    getNumberSuffix,
    // generateCustomFileName,
    generateCustomFileForUpload,
    CustomTooltipOld,
    CustomTooltip,
    CustomImageModal,
    generateCustomKey,

    ViewDynamicApprovalDates,
    ViewDynamicApprovalStatus,
    ViewDynamicApprovalRemarks,
    ViewDocumnetsbilling,
    ButtonVariants,
    AttachmentIcon,
    renderDangerousHTML,
    FormatKey,
    ReorderList,
    getFileNameFromUrl,
    isValidTwoDecimalNumber,
    truncateToTwoDecimals,
    getCurrentFinancialYear,
    calculateDaysFromDateList,
    calculateDaysBetween,
    formatFieldName,
    getStatusClass,
    UserProfileModal,
    getMonthBoundaryDate,
    formatCurrency,
    getMonthYearNameFromDate,
}
