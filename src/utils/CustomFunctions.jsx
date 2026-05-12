import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import { Modal } from "react-bootstrap";
import * as XLSX from "xlsx";
import ReactDOM, { createPortal } from "react-dom";
import { Download, Eye, File, FileText, FileVideoCamera, ImageIcon, Paperclip, Table } from 'lucide-react';
import { IMAGE_URL } from '../services/api';
import { formatDateTime } from './CustomFormatters';


const getFileExtension = (url) => {
    if (!url) return "";
    return url?.split(".").pop()?.toLowerCase().split(/\#|\?/)[0] || "";
};

const isImage = (url) => {
    return /\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/.test(url);
}

const getInitials = (name) => {
    if (!name) return '';
    const nameArray = name.split(" ");
    return nameArray.length > 1
        ? nameArray[0][0]?.toUpperCase() + nameArray[1][0]?.toUpperCase()
        : nameArray[0][0]?.toUpperCase();
};

const getRandomColor = (name) => {
    const colorPairs = [
        { light: "#fbbfc8ff", dark: "#C71585" }, // Light pink and dark pink
        { light: "#f996c7ff", dark: "#C71585" }, // Light hot pink and dark pink
        { light: "#f598c9ff", dark: "#8B008B" }, // Deep pink and dark magenta
        { light: "#fa9b8bff", dark: "#B22222" }, // Light red-orange and dark red
        { light: "#fcc1abff", dark: "#8B0000" }, // Orange-red and dark red
        { light: "#FF8C00", dark: "#d55e09ff" }, // Dark orange and chocolate
        { light: "#f6eea3ff", dark: "#978e12ff" }, // Khaki and dark khaki
        { light: "#a7e4f8ff", dark: "#1E90FF" }, // Light sky blue and dark blue
        { light: "#8abfeaff", dark: "#2F4F4F" }, // Steel blue and dark slate gray
        { light: "#aaf2aaff", dark: "#006400" }, // Light green and dark green
        { light: "#b8f7dfff", dark: "#228B22" }, // Medium spring green and forest green
        { light: "#f8edabff", dark: "#FF8C00" }, // Light gold and dark orange
        { light: "#FFDDC1", dark: "#D2691E" }, // Peach and chocolate
        { light: "#d1a7f9ff", dark: "#4B0082" }, // Blue-violet and indigo
        { light: "rgb(210 162 234)", dark: "#8B008B" }, // Dark orchid and dark magenta
        { light: "#fbb6e2ff", dark: "#8B0000" }, // Medium violet red and dark red
        { light: "#C0C0C0", dark: "#808080" }, // Silver and gray
        { light: "#A9A9A9", dark: "#696969" }, // Dark gray and dim gray
        { light: "#dd9561ff", dark: "#2F4F4F" }, // Saddle brown and dark slate gray
        { light: "#FFA500", dark: "#FF4500" }, // Orange and orange-red
        { light: "#f78bc4ff", dark: "#a70566ff" }, // Deep pink and dark magenta
        { light: "#f9dcdcff", dark: "#A9A9A9" }, // Light gray and dark gray
        { light: "#E0FFFF", dark: "#00CED1" }, // Light cyan and dark turquoise
        { light: "#F5FFFA", dark: "#2F4F4F" }, // Mint cream and dark slate gray
        { light: "#c6f97aff", dark: "#006400" }, // Green yellow and dark green
        { light: "#b5f9f9ff", dark: "#008B8B" }, // Aqua and dark cyan
        { light: "#9befebff", dark: "#008B8B" }, // Light sea green and dark cyan
        { light: "#b4e3f6ff", dark: "#4682B4" }, // Sky blue and steel blue
        { light: "#FFFFE0", dark: "#BDB76B" }, // Light yellow and dark khaki
    ];

    const index = name.charCodeAt(0) % colorPairs.length;
    return colorPairs[index];
};

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
            <button title={"View File"} style={{ cursor: "pointer" }} onClick={handleShow}>
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
                                                {getInitials(i?.name || '')}
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

const UserDefaultLogo = ({ user, customStyleforParent, customStyleforChild }) => {
    if (!user) {
        const randomColor = getRandomColor("default");
        return (
            <div
                className="circle"
                style={{ backgroundColor: randomColor.light }}
            ></div>
        );
    }

    const hasProfilePic = user?.profilepic;
    const initials = getInitials(user?.name || '');
    const { light: backgroundColor, dark: textColor } = getRandomColor(user.name || "#f6f7f9");

    return (
        <div className={`${customStyleforParent}`}>

            {hasProfilePic ? (
                <img
                    src={`${IMAGE_URL}${user.profilepic}`}
                    alt={user.name || 'User'}
                    className={`${customStyleforChild} circle`}
                    style={{ borderRadius: '50%', objectFit: 'cover', width: '100%', height: '100%' }}
                />
            ) : (
                <div
                    className={`${customStyleforChild} circle`}
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
        </div>
    );
};

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
        <div className="d-flex align-items-center gap-2 flex flex-col">
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
    getFileNameFromLink,
    ViewFile,
    ViewOtherFile,
    ViewChatImageorFile,
    ViewEmployeeList,
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
