import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  X,
  Trash2,
  Info,
  Search,
  Building2,
  MapPin,
  Ruler,
  IndianRupee,
  Briefcase,
  Users,
  Hash,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Percent,
  Edit3,
  Loader2,
  IdCard,
  ALargeSmall,
  Factory,
  User,
  Handshake,
  MapPinned,
  BadgePercent,
  Copy,
  DockIcon,
  Upload,
} from "lucide-react";
import {
  fetchCompanies,
  fetchSubCompanies,
  fetchSectors,
  fetchClients,
  fetchActivities,
  fetchSubActivities,
  createSector,
  createCompany,
  createClient,
  createActivitiesBulk,
  createSubActivitiesBulk,
  createProject as createProjectApi,
  clearActivities,
  clearSubActivities,
  fetchReportingHeads,
  fetchActivityTemplate,
} from "../api/apiSlice";
import { showSnackbar } from "../notifications/notificationSlice";
import { addProject } from "./projectSlice";
import { UNIT_OPTIONS, SECTOR_UNIT_MAPPING } from "../../utils/enumMapping";
import { IMAGE_URL } from "../../services/api";
import { CustomImageModal } from "../../utils/CustomFunctions";

const CreateProject = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    companies = [],
    // subCompanies = [],
    sectors = [],
    clients = [],
    reportingHeads = [],
    activityTemplates = [],
    // activities = [],
    // subActivities = [],
    loading,
  } = useSelector((state) => state.api);

  const [form, setForm] = useState({
    project_code: "",
    project_name: "",
    short_name: "",
    company: "",
    location: "",
    sector: "",
    client: "",
    total_length: "",
    workorder_Amount: "",
    igst_percentage: "18",
    cgst_percentage: "9",
    // sgst_percentage: "9",
    director_proposal_date: "",
    project_confirmation_date: "",
    loa_date: "",
    completion_date: "",
    assigned_to: [],
    clientbranch: "",
    workorder_document: ""
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sectorsList, setSectorsList] = useState([]);
  const [sectorsMap, setSectorsMap] = useState({});

  const [templatesActivities, setTemplateActivities] = useState([]);
  const [customActivities, setCustomActivities] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [reportingHeadSearch, setReportingHeadSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showSupervisorDropdown, setShowSupervisorDropdown] = useState(false);
  const clientDropdownRef = useRef(null);
  const ReportingHeadsDropdownRef = useRef(null);

  const [calculatedGST, setCalculatedGST] = useState({
    igst: 0,
    cgst: 0,
    total: 0,
    totalWithGST: 0,
  });

  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    gst_no: "",
  });

  const [showAddSectorModal, setShowAddSectorModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newSector, setNewSector] = useState({
    name: "",
    unit: "",
  });

  const [newClient, setNewClient] = useState({
    code: "",
    client_name: "",
    contact: "",
    pan_no: "",
    status: "active",
    address: "",
  });

  const [selectedActivities, setSelectedActivities] = useState([]);
  const [activityWeightages, setActivityWeightages] = useState({});
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [activityDates, setActivityDates] = useState({});

  const [selectedSubActivities, setSelectedSubActivities] = useState({});
  const [subActivityPlannedQtys, setSubActivityPlannedQtys] = useState({});
  const [subActivityUnits, setSubActivityUnits] = useState({});

  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showAddSubActivityModal, setShowAddSubActivityModal] = useState(false);

  const [showEditSubActivityModal, setShowEditSubActivityModal] = useState(false);
  const [editingSubActivity, setEditingSubActivity] = useState(null);

  const [showCloneSubActivityModal, setShowCloneSubActivityModal] = useState(false);
  const [cloningSubActivity, setCloningSubActivity] = useState(null);

  const [selectedActivityForSub, setSelectedActivityForSub] = useState(null);
  const [newActivityName, setNewActivityName] = useState("");
  const [newSubActivity, setNewSubActivity] = useState({
    subactivity_name: "",
    unit: "Km",
    chainage_start: "",
    covered_area: "",
    chainage_quantity: "",
    activityType: "single",
    lengthType: "same", // 'same' or 'different'
    chainageLengths: [],
  });

  const [editingActivityStage, setEditingActivityStage] = useState(null); // { activityId, currentStage }
  const [editingStage, setEditingStage] = useState(null); // { activityId, subId, currentStage }
  const [availableStages, setAvailableStages] = useState([]);

  const [branches, setBranches] = useState([
    { name: "", gst: "", state: "", status: "Active" },
  ]);

  const addBranch = () => {
    setBranches([
      ...branches,
      { name: "", gst: "", state: "", status: "Active" },
    ]);
  };

  const removeBranch = (index) => {
    setBranches(branches.filter((_, i) => i !== index));
  };

  const handleBranchChange = (index, field, value) => {
    const updated = [...branches];
    updated[index][field] = value;
    setBranches(updated);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          dispatch(fetchCompanies()),
          // dispatch(fetchSubCompanies()), // Not in use
          dispatch(fetchSectors()),
          dispatch(fetchClients()),
          dispatch(fetchReportingHeads()),

          dispatch(fetchActivityTemplate()),
          // dispatch(fetchActivities()),
          // dispatch(fetchSubActivities())
        ]);
      } catch (error) {
        dispatch(
          showSnackbar({
            message:
              "Some reference data could not be loaded. You can still try again or refresh the page.",
            type: "warning",
          }),
        );
      }
    };
    fetchInitialData();

    return () => {
      dispatch(clearActivities());
      dispatch(clearSubActivities());
    };
  }, [dispatch]);
  useEffect(() => {
    if (sectors && sectors.length > 0) {
      const map = {};
      sectors.forEach((sector) => {
        map[sector.name] = sector.id;
      });
      setSectorsMap(map);
      setSectorsList(sectors);
    }
  }, [sectors]);

  //Activity,Sub-Activity Template
  useEffect(() => {
    if (activityTemplates && activityTemplates.length > 0) {
      const transformedActivities = activityTemplates
        .filter((act) => !act.is_deleted)
        .map((template, index) => ({
          id:
            template.id ||
            `template-activity-${template.sorting_var}` ||
            `template-activity-${index}`,
          sorting_var: template.sorting_var,
          activity_name: template.activity_name,
          start_date: template.start_date,
          end_date: template.end_date,
          weightage: template.weightage,
          isFromTemplate: true,
          isCustom: false,
          subActivities: template.subactivities
            .filter((sub) => !sub.is_deleted) // Only include non-deleted sub-activities
            .map((sub) => ({
              id:
                sub.id ||
                `template-subactivity-${sub.sorting_var}` ||
                `template-subactivity-${index}`,
              sorting_var: sub.sorting_var,
              subactivity_name: sub.subactivity_name,
              description: sub.description,
              unit: sub.unit,
              total_quantity: sub.total_quantity,
              submission_payment: sub.submission_payment,
              approval_payment: sub.approval_payment,
              chainage_start: sub.chainage_start,
              chainage_end: sub.chainage_end,
              covered_area: sub.covered_area,
              chainage_exist: sub.chainage_exist,
              planned_quantity_exist: sub.planned_quantity_exist,
              length_exist: sub.length_exist,
              submission_exist: sub.submission_exist,
              approval_exist: sub.approval_exist,
              // activityType: sub.chainage_start ? 'multiple' : 'single',
            }))
            .sort((a, b) => (a.sorting_var || 0) - (b.sorting_var || 0)), // Sort Sub-Activities by sorting_var
        }))
        .sort((a, b) => (a.sorting_var || 0) - (b.sorting_var || 0)); // Sort Activities by sorting_var
      setTemplateActivities(transformedActivities);
    } else {
      setTemplateActivities([]);
    }
  }, [activityTemplates]);

  //GST Calculation
  useEffect(() => {
    const workorderCost = parseFloat(form.workorder_Amount) || 0;
    const igst = parseFloat(form.igst_percentage) || 0;
    const cgst = parseFloat(form.cgst_percentage) || 0;

    const igstAmount = (workorderCost * igst) / 100;
    const cgstAmount = (workorderCost * cgst) / 100;
    const totalGST = igstAmount;
    // + cgstAmount;
    const totalWithGST = workorderCost + totalGST;

    setCalculatedGST({
      igst: igstAmount,
      cgst: cgstAmount,
      total: totalGST,
      totalWithGST: totalWithGST,
    });
  }, [form.workorder_Amount, form.igst_percentage, form.cgst_percentage]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target)
      ) {
        setShowClientDropdown(false);
      }
      if (
        ReportingHeadsDropdownRef.current &&
        !ReportingHeadsDropdownRef.current.contains(event.target)
      ) {
        setShowSupervisorDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // console.log(workorder_document);

    if (name == "workorder_document") {
      setForm((prev) => ({
        ...prev,
        [name]: e.target.files,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleActivityDateChange = (activityId, field, value) => {
    setActivityDates((prev) => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        [field]: value,
      },
    }));
  };

  const getActivityTotals = (activity, storeData) => {
    let totalSubmission = 0;
    let totalApproval = 0;

    activity.subActivities.forEach((sub) => {
      const subId = sub.id;

      const submissionKey = `${subId}_subpayment`;
      const approvalKey = `${subId}_approvalpayment`;

      const submissionValue = parseFloat(storeData[submissionKey]) || 0;
      const approvalValue = parseFloat(storeData[approvalKey]) || 0;

      totalSubmission += submissionValue;
      totalApproval += approvalValue;
    });

    return totalSubmission + totalApproval;
  };

  const handleActivityWeightageChange = (activityId, value, subid) => {
    const numValue = parseFloat(value) || 0;

    if (numValue > 100) {
      dispatch(
        showSnackbar({
          message: "Weightage cannot exceed 100%",
          type: "error",
        }),
      );
      handleSubActivityPlannedQtyChange(subid, "approvalpayment", 0);
      handleSubActivityPlannedQtyChange(subid, "subpayment", 0);
      return;
    }
    setActivityWeightages((prev) => ({
      ...prev,
      [activityId]: numValue,
    }));
  };

  const handleSubActivitySelection = (activityId, subId, checked) => {
    setSelectedSubActivities((prev) => {
      const activitySubs = new Set(prev[activityId] || []);
      if (checked) {
        activitySubs.add(subId);
      } else {
        activitySubs.delete(subId);
      }

      return {
        ...prev,
        [activityId]: Array.from(activitySubs),
      };
    });
  };

  const handleSelectAllSubActivities = (activityId, selectAll) => {
    const activityObj = getAllActivities().find((a) => a.id === activityId);

    if (!activityObj) return;

    if (selectAll) {
      // Select all sub-activities
      const allSubIds = activityObj.subActivities.map((sub) => sub.id);
      setSelectedSubActivities((prev) => ({
        ...prev,
        [activityId]: allSubIds,
      }));
    } else {
      // Unselect all sub-activities
      setSelectedSubActivities((prev) => ({
        ...prev,
        [activityId]: [],
      }));
    }
  };

  const getSelectAllStatus = (activityId) => {
    const activityObj = getAllActivities().find((a) => a.id === activityId);
    if (!activityObj) return { isAllSelected: false, isIndeterminate: false };

    const selectedCount = (selectedSubActivities[activityId] || []).length;
    const totalCount = activityObj.subActivities.length;

    return {
      isAllSelected: selectedCount === totalCount && totalCount > 0,
      isIndeterminate: selectedCount > 0 && selectedCount < totalCount,
    };
  };

  const handleSubActivityUnitChange = (activityId, subId, unit) => {
    setSubActivityUnits((prev) => ({
      ...prev,
      [`${activityId}_${subId}`]: unit,
    }));
  };
  // const handleSubActivityPlannedQtyChange = (activityId, subActivityName, value) => {
  //   const numValue = parseFloat(value) || 0;
  //   setSubActivityPlannedQtys(prev => ({
  //     ...prev,
  //     [`${activityId}_${subActivityName}`]: numValue
  //   }));
  // };

  // const handleSubActivityPlannedQtyChange = (activityId, subActivityName, value) => {
  //   // Check if this is a description field
  //   if (subActivityName.includes('_description') ||
  //     subActivityName.includes('_subpayment') ||
  //     subActivityName.includes('_approvalpayment') ||
  //     subActivityName.includes('_chainagestart') ||
  //     subActivityName.includes('_chainageend')) {
  //     // For description and payment fields, we might want to keep them as strings or numbers
  //     // For description specifically, keep as string
  //     if (subActivityName.includes('_description')) {
  //       setSubActivityPlannedQtys(prev => ({
  //         ...prev,
  //         [`${activityId}_${subActivityName}`]: value // Keep as string
  //       }));
  //     } else {
  //       // For other fields (payments, chainage), treat as numbers
  //       const numValue = value === '' ? '' : parseFloat(value);
  //       const finalValue = isNaN(numValue) ? '' : numValue;
  //       setSubActivityPlannedQtys(prev => ({
  //         ...prev,
  //         [`${activityId}_${subActivityName}`]: finalValue
  //       }));
  //     }
  //   } else {
  //     // For quantity fields
  //     const numValue = parseFloat(value) || 0;
  //     setSubActivityPlannedQtys(prev => ({
  //       ...prev,
  //       [`${activityId}_${subActivityName}`]: numValue
  //     }));
  //   }
  // };

  const handleSubActivityPlannedQtyChange = (subId, field, value) => {
    if (field === "description") {
      setSubActivityPlannedQtys((prev) => ({
        ...prev,
        [`${subId}_${field}`]: value,
      }));
    } else if (
      field === "subpayment" ||
      field === "approvalpayment" ||
      field === "chainagestart" ||
      field === "chainageend" ||
      field === "coveredarea"
    ) {
      const numValue = value === "" ? "" : parseFloat(value);
      const finalValue = isNaN(numValue) ? "" : numValue;
      setSubActivityPlannedQtys((prev) => ({
        ...prev,
        [`${subId}_${field}`]: finalValue,
      }));
    } else if (field === "quantity") {
      const numValue = parseFloat(value) || 0;
      setSubActivityPlannedQtys((prev) => ({
        ...prev,
        [`${subId}_${field}`]: numValue,
      }));
    }
  };

  const handleAddCompany = async () => {
    const trimmedName = newCompany?.name.trim();
    const trimmedgst = newCompany?.gst_no.trim();
    const trimpancard = newCompany?.pan_no?.trim();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (newCompany?.pan_no && !panRegex.test(trimpancard?.toUpperCase())) {
      dispatch(
        showSnackbar({
          message: "Invalid PAN number format",
          type: "error",
        }),
      );
      return;
    }
    if (newCompany?.gst_no && !gstRegex.test(trimmedgst?.toUpperCase())) {
      dispatch(
        showSnackbar({
          message: "Invalid GST number format",
          type: "error",
        }),
      );
      return;
    }

    // Check if name is empty
    if (!trimmedName || !trimmedgst || !trimpancard) {
      dispatch(
        showSnackbar({
          message:
            "Please enter " +
            ((!trimmedName && "Company name") ||
              (!trimpancard && "PAN NO.") ||
              (!trimmedgst && "GST")),
          type: "error",
        }),
      );
      return;
    }

    // Check for duplicate in existing companies list (case-insensitive)
    const isDuplicate = companies.some(
      (company) =>
        company.name?.toLowerCase() === trimmedName.toLowerCase() ||
        company.gst_no?.toLowerCase() === trimmedgst.toLowerCase(),
    );

    if (isDuplicate) {
      dispatch(
        showSnackbar({
          message: `Company "${trimmedName}" or "${trimmedgst}"already exists!`,
          type: "error",
        }),
      );
      return;
    }

    try {
      // Try to add via API
      const result = await dispatch(
        createCompany({ name: trimmedName, gst_no: trimmedgst, created_by: sessionStorage.getItem('emp_code')}),
      ).unwrap();
      dispatch(
        showSnackbar({
          message: "Company added successfully!",
          type: "success",
        }),
      );

      // Refresh companies list
      await dispatch(fetchCompanies());

      // Auto-select the newly added company
      setForm((prev) => ({
        ...prev,
        company: trimmedName,
        gst_no: trimmedgst,
      }));

      setNewCompany({
        name: "",
        gst_no: "",
      });
      setShowAddCompanyModal(false);
    } catch (error) {
      console.error("Error adding company:", error);

      const errorMessage =
        error?.response?.data?.message || error?.response?.data?.detail || "";

      if (
        errorMessage.toLowerCase().includes("already exists") ||
        errorMessage.toLowerCase().includes("duplicate")
      ) {
        dispatch(
          showSnackbar({
            message: `Company "${trimmedName}" already exists!`,
            type: "error",
          }),
        );
      } else {
        dispatch(
          showSnackbar({
            message: "Failed to add company. Please try again.",
            type: "error",
          }),
        );
      }
    }
  };

  const handleAddSector = async () => {
    const name = newSector.name.trim();
    const unit = newSector.unit.trim();
    if (!name || !unit) {
      dispatch(
        showSnackbar({
          message: "Please enter sector name and unit",
          type: "error",
        }),
      );
      return;
    }
    const duplicate = sectors.some(
      (s) => s.name?.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      dispatch(
        showSnackbar({ message: "This sector already exists.", type: "error" }),
      );
      return;
    }

    try {
      await dispatch(createSector({ name, unit, created_by: sessionStorage.getItem('emp_code'), })).unwrap();
      dispatch(
        showSnackbar({ message: "Sector added successfully", type: "success" }),
      );
      await dispatch(fetchSectors());
      setForm((prev) => ({ ...prev, sector: name }));
      setNewSector({ name: "", unit: "" });
      setShowAddSectorModal(false);
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error?.message || "Could not add sector. Please try again.",
          type: "error",
        }),
      );
    }
  };

  const handleAddClient = async () => {
    if (
      !newClient?.code.trim() ||
      !newClient?.client_name.trim() ||
      !newClient?.contact.trim() ||
      !newClient?.pan_no.trim() ||
      !newClient?.address.trim() ||
      !newClient?.status.trim() ||
      !branches[0]?.gst.trim() ||
      !branches[0]?.name.trim() ||
      !branches[0]?.state.trim() ||
      !branches[0]?.status.trim()
    ) {
      dispatch(
        showSnackbar({
          message: "Please enter all required fields",
          type: "error",
        }),
      );
      return;
    }
    try {
      const createdClient = await dispatch(
        createClient({
          client_name: newClient?.client_name,
          address: newClient?.address,
          phone: newClient?.contact,
          pan_no: newClient?.pan_no,
          client_code: newClient?.code,
          status: newClient?.status,
          branches: branches,
          created_by: sessionStorage.getItem('emp_code')
        }),
      ).unwrap();
      dispatch(
        showSnackbar({ message: "Client added successfully", type: "success" }),
      );
      await dispatch(fetchClients());
      setForm((prev) => ({ ...prev, client: createdClient.id }));
      setClientSearch(newClient?.client_name);
      setNewClient({
        code: "",
        client_name: "",
        contact: "",
        pan_no: "",
        status: "",
        address: "",
      });
      setBranches([{ name: "", gst: "", state: "", status: "Active" }]);
      setShowAddClientModal(false);
    } catch (error) {
      const msg =
        error?.data?.detail ||
        error?.data?.message ||
        error?.message ||
        "Failed to add client. Please try again.";
      dispatch(showSnackbar({ message: String(msg), type: "error" }));
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newActivityName.trim()) {
      dispatch(
        showSnackbar({
          message: "Please enter activity name",
          type: "error",
        }),
      );
      return;
    }
    const newActivity = {
      id: `custom-${Date.now()}`,
      activity_name: newActivityName,
      subActivities: [],
      isCustom: true,
    };
    setCustomActivities((prev) => [...prev, newActivity]);
    setNewActivityName("");
    setShowAddActivityModal(false);
    dispatch(
      showSnackbar({
        message: "Activity added successfully",
        type: "success",
      }),
    );
  };

  const handleAddSubActivity = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newSubActivity.subactivity_name.trim()) {
      dispatch(
        showSnackbar({
          message: "Please enter sub-activity name",
          type: "error",
        }),
      );
      return;
    }

    let newSubs = [];

    if (newSubActivity.activityType === "single") {
      newSubs = [
        {
          id: `custom-sub-${Date.now()}`,
          sorting_var: null,
          subactivity_name: newSubActivity.subactivity_name,
          unit: newSubActivity.unit,
          activityType: newSubActivity.activityType,
          chainage_start: null,
          chainage_end: null,
          covered_area: null,
          chainage_quantity: null,
          lengthType: "same",
          chainageLengths: [],
          isCustom: true,
          approval_exist: true,
          chainage_exist: true,
          length_exist: true,
          planned_quantity_exist: true,
          submission_exist: true,
        },
      ];
    } else {
      // const start = Number(newSubActivity.chainage_start) || 0;
      // const count = Number(newSubActivity.chainage_quantity) || 0;
      const start = Number(newSubActivity.chainage_start);
      const count = Number(newSubActivity.chainage_quantity);

      if (!count || start === undefined) {
        dispatch(
          showSnackbar({
            message:
              "Enter valid Chainage Details (Start Chainage and Quantity)",
            type: "error",
          }),
        );
        return;
      }

      let currentStart = start;

      if (newSubActivity.lengthType === "same") {
        const covered = Number(newSubActivity.covered_area) || 0;
        if (!covered) {
          dispatch(
            showSnackbar({
              message: "Please enter Chainage Length",
              type: "error",
            }),
          );
          return;
        }

        for (let i = 0; i < count; i++) {
          const currentEnd = Number((currentStart + covered).toFixed(2));
          newSubs.push({
            id: `custom-sub-${Date.now()}-${i}`,
            sorting_var: null,
            subactivity_name: newSubActivity.subactivity_name + ` (${i + 1})`,
            unit: newSubActivity.unit,
            chainage_start: currentStart,
            chainage_end: currentEnd,
            covered_area: covered,
            chainage_quantity: count,
            activityType: newSubActivity.activityType,
            lengthType: "same",
            chainageLengths: [],
            lengthIndex: i,
            isCustom: true,
            approval_exist: true,
            chainage_exist: true,
            length_exist: true,
            planned_quantity_exist: true,
            submission_exist: true,
          });
          currentStart = currentEnd;
        }
      } else {
        // Different lengths
        const lengths = newSubActivity.chainageLengths;
        if (lengths.length !== count) {
          dispatch(
            showSnackbar({
              message: `Please enter lengths for all ${count} chainages`,
              type: "error",
            }),
          );
          return;
        }

        for (let i = 0; i < count; i++) {
          const covered = Number(lengths[i]) || 0;
          if (!covered) {
            dispatch(
              showSnackbar({
                message: `Please enter valid length for chainage ${i + 1}`,
                type: "error",
              }),
            );
            return;
          }
          const currentEnd = Number((currentStart + covered).toFixed(2));
          newSubs.push({
            id: `custom-sub-${Date.now()}-${i}`,
            sorting_var: null,
            subactivity_name: newSubActivity.subactivity_name,
            unit: newSubActivity.unit,
            chainage_start: currentStart,
            chainage_end: currentEnd,
            covered_area: covered,
            chainage_quantity: count,
            activityType: newSubActivity.activityType,
            chainageLengths: lengths,
            lengthType: "different",
            lengthIndex: i,
            isCustom: true,
          });
          currentStart = currentEnd;
        }
      }
    }

    // Rest of the function remains the same...
    const templateIndex = templatesActivities.findIndex(
      (act) => act.id === selectedActivityForSub,
    );

    const newSubIds = newSubs.map((s) => s.id);
    const lastSubId = newSubIds[newSubIds.length - 1];

    // Get existing sub-activities
    const existingSubs =
      templateIndex !== -1
        ? [...(templatesActivities[templateIndex]?.subActivities || [])]
        : [
          ...(customActivities.find(
            (act) => act.id === selectedActivityForSub,
          )?.subActivities || []),
        ];

    // Find insertion position for same name sub-activities (case-insensitive)
    let insertIndex = existingSubs.length;
    const lowerNewName = newSubActivity.subactivity_name.toLowerCase();
    for (let i = existingSubs.length - 1; i >= 0; i--) {
      if (existingSubs[i]?.subactivity_name?.toLowerCase() === lowerNewName) {
        insertIndex = i + 1;
        break;
      }
    }

    // Create updated sub-activities array with new items inserted
    const updatedSubActivities = [...existingSubs];
    updatedSubActivities.splice(insertIndex, 0, ...newSubs);

    // Reassign sorting_var values based on new order
    const reassignedSubActivities = updatedSubActivities.map((sub, idx) => ({
      ...sub,
      sorting_var: idx + 1, // sorting_var starts from 1
    }));

    if (templateIndex !== -1) {
      setTemplateActivities((prev) =>
        prev.map((act, index) => {
          if (index === templateIndex) {
            return {
              ...act,
              // subActivities: [...act.subActivities, ...newSubs],
              subActivities: reassignedSubActivities,
            };
          }
          return act;
        }),
      );
    } else {
      setCustomActivities((prev) =>
        prev.map((act) => {
          if (act.id === selectedActivityForSub) {
            return {
              ...act,
              subActivities: reassignedSubActivities,
              // subActivities: [...act.subActivities, ...newSubs],
            };
          }
          return act;
        }),
      );
      // setSelectedSubActivities((prev) => ({
      //   ...prev,
      //   [selectedActivityForSub]: [
      //     ...(prev[selectedActivityForSub] || []),
      //     ...newSubIds,
      //   ],
      // }));
    }

    // Auto-select the new sub-activities (select by their new IDs)
    setSelectedSubActivities((prev) => ({
      ...prev,
      [selectedActivityForSub]: [
        ...(prev[selectedActivityForSub] || []),
        ...newSubIds,
      ],
    }));

    // Scroll to the newly added sub-activity
    setTimeout(() => {
      const lastSubElement = document.getElementById(`sub-${lastSubId}`);
      if (lastSubElement) {
        lastSubElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    setNewSubActivity({
      subactivity_name: "",
      unit: "Km",
      chainage_start: "",
      covered_area: "",
      chainage_quantity: "",
      activityType: "single",
      lengthType: "same",
      chainageLengths: [],
    });

    setShowAddSubActivityModal(false);
    setSelectedActivityForSub(null);

    dispatch(
      showSnackbar({
        message: "Sub-activity added successfully",
        type: "success",
      }),
    );
  };

  const handleCloneSubActivity = (activityId, subId) => {
    const activityObj = getAllActivities().find((a) => a.id === activityId);
    const subObj = activityObj?.subActivities.find((s) => s.id === subId);

    if (subObj) {
      // Prepare clone data with name and unit pre-filled and locked
      setCloningSubActivity({
        activityId,
        sourceSubId: subId,
        subactivity_name: subObj.subactivity_name,
        unit: subObj.unit,
        activityType: subObj.activityType || "single",
        chainage_start: subObj.chainage_start || "",
        covered_area: subObj.covered_area || "",
        chainage_quantity: subObj.chainage_quantity || "",
        lengthType: subObj.lengthType || "same",
        chainageLengths: subObj.chainageLengths || [],
        isCustom: true,
      });
      setShowCloneSubActivityModal(true);
    }
  };

  const handleCloneSubActivitySubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!cloningSubActivity) return;

    let newSubs = [];

    if (cloningSubActivity.activityType === "single") {
      newSubs = [
        {
          id: `custom-sub-${Date.now()}`,
          sorting_var: null,
          subactivity_name: cloningSubActivity.subactivity_name,
          unit: cloningSubActivity.unit,
          activityType: cloningSubActivity.activityType,
          chainage_start: null,
          chainage_end: null,
          covered_area: null,
          chainage_quantity: null,
          lengthType: "same",
          chainageLengths: [],
          isCustom: true,
        },
      ];
    } else {
      const start = Number(cloningSubActivity.chainage_start) || 0;
      const count = Number(cloningSubActivity.chainage_quantity) || 0;

      if (!count || start === undefined) {
        dispatch(
          showSnackbar({
            message:
              "Enter valid Chainage Details (Start Chainage and Quantity)",
            type: "error",
          }),
        );
        return;
      }

      let currentStart = start;

      if (cloningSubActivity.lengthType === "same") {
        const covered = Number(cloningSubActivity.covered_area) || 0;
        if (!covered) {
          dispatch(
            showSnackbar({
              message: "Please enter Chainage Length",
              type: "error",
            }),
          );
          return;
        }

        for (let i = 0; i < count; i++) {
          const currentEnd = Number((currentStart + covered).toFixed(2));
          newSubs.push({
            id: `custom-sub-${Date.now()}-${i}`,
            sorting_var: null,
            subactivity_name: cloningSubActivity.subactivity_name,
            unit: cloningSubActivity.unit,
            chainage_start: currentStart,
            chainage_end: currentEnd,
            covered_area: covered,
            chainage_quantity: count,
            activityType: cloningSubActivity.activityType,
            lengthType: "same",
            chainageLengths: [],
            lengthIndex: i,
            isCustom: true,
          });
          currentStart = currentEnd;
        }
      } else {
        const lengths = cloningSubActivity.chainageLengths;
        if (lengths.length !== count) {
          dispatch(
            showSnackbar({
              message: `Please enter lengths for all ${count} chainages`,
              type: "error",
            }),
          );
          return;
        }

        for (let i = 0; i < count; i++) {
          const covered = Number(lengths[i]) || 0;
          if (!covered) {
            dispatch(
              showSnackbar({
                message: `Please enter valid length for chainage ${i + 1}`,
                type: "error",
              }),
            );
            return;
          }
          const currentEnd = Number((currentStart + covered).toFixed(2));
          newSubs.push({
            id: `custom-sub-${Date.now()}-${i}`,
            sorting_var: null,
            subactivity_name: cloningSubActivity.subactivity_name,
            unit: cloningSubActivity.unit,
            chainage_start: currentStart,
            chainage_end: currentEnd,
            covered_area: covered,
            chainage_quantity: count,
            activityType: cloningSubActivity.activityType,
            chainageLengths: lengths,
            lengthType: "different",
            lengthIndex: i,
            isCustom: true,
          });
          currentStart = currentEnd;
        }
      }
    }

    const activityId = cloningSubActivity.activityId;
    const templateIndex = templatesActivities.findIndex(
      (act) => act.id === activityId,
    );

    const newSubIds = newSubs.map((s) => s.id);
    const lastSubId = newSubIds[newSubIds.length - 1];

    // Get existing sub-activities
    const existingSubs =
      templateIndex !== -1
        ? [...(templatesActivities[templateIndex]?.subActivities || [])]
        : [
          ...(customActivities.find((act) => act.id === activityId)
            ?.subActivities || []),
        ];

    // Find insertion position for same name sub-activities (case-insensitive)
    let insertIndex = existingSubs.length;
    const lowerNewName = cloningSubActivity.subactivity_name.toLowerCase();
    for (let i = existingSubs.length - 1; i >= 0; i--) {
      if (existingSubs[i]?.subactivity_name?.toLowerCase() === lowerNewName) {
        insertIndex = i + 1;
        break;
      }
    }

    // Create updated sub-activities array with new items inserted
    const updatedSubActivities = [...existingSubs];
    updatedSubActivities.splice(insertIndex, 0, ...newSubs);

    // Reassign sorting_var values based on new order
    const reassignedSubActivities = updatedSubActivities.map((sub, idx) => ({
      ...sub,
      sorting_var: idx + 1,
    }));

    if (templateIndex !== -1) {
      setTemplateActivities((prev) =>
        prev.map((act, index) => {
          if (index === templateIndex) {
            return {
              ...act,
              subActivities: reassignedSubActivities,
            };
          }
          return act;
        }),
      );
    } else {
      setCustomActivities((prev) =>
        prev.map((act) => {
          if (act.id === activityId) {
            return {
              ...act,
              subActivities: reassignedSubActivities,
            };
          }
          return act;
        }),
      );
    }

    // Auto-select the new sub-activities
    setSelectedSubActivities((prev) => ({
      ...prev,
      [activityId]: [...(prev[activityId] || []), ...newSubIds],
    }));

    // Scroll to the newly added sub-activity
    setTimeout(() => {
      const lastSubElement = document.getElementById(`sub-${lastSubId}`);
      if (lastSubElement) {
        lastSubElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    setShowCloneSubActivityModal(false);
    setCloningSubActivity(null);

    dispatch(
      showSnackbar({
        message: "Sub-activity cloned successfully",
        type: "success",
      }),
    );
  };

  const handleEditSubActivity = (activityId, subId) => {
    const activityObj = getAllActivities().find((a) => a.id === activityId);
    const subObj = activityObj?.subActivities.find((s) => s.id === subId);

    if (subObj) {
      setEditingSubActivity({
        activityId,
        subId,
        subactivity_name: subObj.subactivity_name,
        unit: subObj.unit,
        chainage_start: subObj.chainage_start || "",
        covered_area: subObj.covered_area || "",
        chainage_quantity: subObj.chainage_quantity || "",
        activityType: subObj.activityType || "single",
      });
      setShowEditSubActivityModal(true);
    }
  };

  const handleUpdateSubActivity = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editingSubActivity) return;

    const {
      activityId,
      subId,
      subactivity_name,
      unit,
      chainage_start,
      covered_area,
      chainage_quantity,
      activityType,
    } = editingSubActivity;

    const updatedSub = {
      id: subId,
      subactivity_name,
      unit,
      activityType,
      ...(activityType === "multiple" && {
        chainage_start: parseFloat(chainage_start) || 0,
        covered_area: parseFloat(covered_area) || 0,
        chainage_quantity: parseFloat(chainage_quantity) || 0,
      }),
    };

    const templateIndex = templatesActivities.findIndex(
      (act) => act.id === activityId,
    );

    if (templateIndex !== -1) {
      setTemplateActivities((prev) =>
        prev.map((act) => {
          if (act.id === activityId) {
            return {
              ...act,
              subActivities: act.subActivities.map((sub) =>
                sub.id === subId ? { ...sub, ...updatedSub } : sub,
              ),
            };
          }
          return act;
        }),
      );
    } else {
      setCustomActivities((prev) =>
        prev.map((act) => {
          if (act.id === activityId) {
            return {
              ...act,
              subActivities: act.subActivities.map((sub) =>
                sub.id === subId ? { ...sub, ...updatedSub } : sub,
              ),
            };
          }
          return act;
        }),
      );
    }

    setShowEditSubActivityModal(false);
    setEditingSubActivity(null);

    dispatch(
      showSnackbar({
        message: "Sub-activity updated successfully",
        type: "success",
      }),
    );
  };

  const handleDeleteActivity = (activityId) => {
    if (
      window.confirm(
        `Are you sure you want to remove activity "${getAllActivities().find((a) => a.id === activityId).activity_name}"?`,
      )
    ) {
      setCustomActivities((prev) => prev.filter((a) => a.id !== activityId));
      setSelectedActivities((prev) => prev.filter((a) => a !== activityId));
      const newWeightages = { ...activityWeightages };
      delete newWeightages[activityId];
      setActivityWeightages(newWeightages);
      const newDates = { ...activityDates };
      delete newDates[activityId];
      setActivityDates(newDates);
      const newSubSelections = { ...selectedSubActivities };
      delete newSubSelections[activityId];
      setSelectedSubActivities(newSubSelections);
      dispatch(
        showSnackbar({
          message: "Activity deleted successfully",
          type: "success",
        }),
      );
    }
  };

  const handleDeleteSubActivity = (activityId, subId) => {
    const subToDelete = getAllActivities()
      .find((a) => a.id === activityId)
      ?.subActivities.find((s) => s.id === subId);

    if (!subToDelete) return;

    if (
      window.confirm(
        `Are you sure you want to remove sub-activity "${subToDelete.subactivity_name}"?`,
      )
    ) {
      const templateIndex = templatesActivities.findIndex(
        (act) => act.id === activityId,
      );

      let updatedSubActivities;

      if (templateIndex !== -1) {
        // Get current sub-activities and filter out the deleted one
        updatedSubActivities = templatesActivities[
          templateIndex
        ].subActivities.filter((sub) => sub.id !== subId);

        // Reassign sorting_var values based on new order
        const reassignedSubActivities = updatedSubActivities.map(
          (sub, idx) => ({
            ...sub,
            sorting_var: idx + 1,
          }),
        );

        setTemplateActivities((prev) =>
          prev.map((act) => {
            if (act.id === activityId) {
              return {
                ...act,
                subActivities: reassignedSubActivities,
              };
            }
            return act;
          }),
        );
      } else {
        // Get current sub-activities from custom activities
        const customActivity = customActivities.find(
          (act) => act.id === activityId,
        );
        if (customActivity) {
          updatedSubActivities = customActivity.subActivities.filter(
            (sub) => sub.id !== subId,
          );

          // Reassign sorting_var values based on new order
          const reassignedSubActivities = updatedSubActivities.map(
            (sub, idx) => ({
              ...sub,
              sorting_var: idx + 1,
            }),
          );

          setCustomActivities((prev) =>
            prev.map((act) => {
              if (act.id === activityId) {
                return {
                  ...act,
                  subActivities: reassignedSubActivities,
                };
              }
              return act;
            }),
          );
        }
      }

      // Clean up related state
      const newUnits = { ...subActivityUnits };
      delete newUnits[`${activityId}_${subId}`];
      setSubActivityUnits(newUnits);

      const newQtys = { ...subActivityPlannedQtys };
      Object.keys(newQtys).forEach((key) => {
        if (key.startsWith(`${subId}_`)) {
          delete newQtys[key];
        }
      });
      setSubActivityPlannedQtys(newQtys);

      if (selectedSubActivities[activityId]) {
        setSelectedSubActivities((prev) => ({
          ...prev,
          [activityId]: prev[activityId].filter((id) => id !== subId),
        }));
      }

      dispatch(
        showSnackbar({
          message: "Sub-activity deleted successfully",
          type: "success",
        }),
      );
    }
  };

  const recalculateStagePositions = (activities, selectedActivityIds, selectedSubActivitiesState) => {
    // Get all selected activities with their subactivities
    const allSelectedActivities = selectedActivityIds
      .map(id => activities.find(a => a.id === id))
      .filter(Boolean);

    // Build a flat list of all selected subactivities with their current stages
    let allSubactivities = [];

    allSelectedActivities.forEach(activity => {
      const selectedSubIds = selectedSubActivitiesState[activity.id] || [];
      const selectedSubs = activity.subActivities.filter(sub => selectedSubIds.includes(sub.id));

      selectedSubs.forEach(sub => {
        allSubactivities.push({
          activityId: activity.id,
          activityName: activity.activity_name,
          subId: sub.id,
          subName: sub.subactivity_name,
          currentStage: sub.sorting_var || 0,
          subData: sub
        });
      });
    });

    // Sort by current stage
    allSubactivities.sort((a, b) => a.currentStage - b.currentStage);

    // Reassign sequential stages starting from 1
    const reassigned = allSubactivities.map((item, idx) => ({
      ...item,
      newStage: idx + 1
    }));

    return reassigned;
  };

  const getAvailableStagesForActivity = (activityId) => {
    const totalActivities = selectedActivities.length;
    const available = [];

    for (let i = 1; i <= totalActivities; i++) {
      available.push(i);
    }

    return available;
  };

  const handleActivityOrderChange = (activityId, newStage) => {
    // Get all selected activities
    const allSelectedActivities = selectedActivities
      .map(id => getAllActivities().find(a => a.id === id))
      .filter(Boolean);

    // Get the target activity
    const targetActivity = allSelectedActivities.find(a => a.id === activityId);
    if (!targetActivity) return;

    const oldStage = targetActivity.sorting_var || 0;
    if (newStage === oldStage) return;

    // Remove target and reinsert at new position
    const otherActivities = allSelectedActivities.filter(a => a.id !== activityId);

    // Insert at new position (1-indexed)
    const newOrder = [...otherActivities];
    newOrder.splice(newStage - 1, 0, targetActivity);

    // Reassign stages sequentially
    const updatedActivities = newOrder.map((activity, idx) => ({
      activityId: activity.id,
      newStage: idx + 1
    }));

    // Update states
    updatedActivities.forEach(({ activityId: actId, newStage: stage }) => {
      const templateIndex = templatesActivities.findIndex(act => act.id === actId);

      if (templateIndex !== -1) {
        setTemplateActivities(prev =>
          prev.map(act => {
            if (act.id === actId) {
              return { ...act, sorting_var: stage };
            }
            return act;
          })
        );
      } else {
        setCustomActivities(prev =>
          prev.map(act => {
            if (act.id === actId) {
              return { ...act, sorting_var: stage };
            }
            return act;
          })
        );
      }
    });

    // Close modal and show success
    setEditingActivityStage(null);
    // dispatch(showSnackbar({
    //   message: "Activity sequence order updated successfully",
    //   type: "success"
    // }));
  };

  const getAvailableStagesForSubactivity = (activityId, subId) => {
    const allSelectedActivities = selectedActivities
      .map(id => getAllActivities().find(a => a.id === id))
      .filter(Boolean);


    const selectedSubIds = selectedSubActivities[activityId] || [];

    const currentActivity = allSelectedActivities.find(act => act.id === activityId);
    const selectedSubs = currentActivity.subActivities?.filter(sub => selectedSubIds.includes(sub.id)) || [];  // objects list of selected sub activities of the activityId

    const available = [];

    selectedSubs.forEach(subactivity => {
      available.push(subactivity.sorting_var);
    });


    return available;
  };

  const handleStageChange = (activityId, subId, newStage) => {
    // Get all selected activities with their sub-activities
    const allSelectedActivities = selectedActivities
      .map(id => getAllActivities().find(a => a.id === id))
      .filter(Boolean);

    // Collect all selected sub-activities
    let allSubs = [];

    allSelectedActivities.forEach(activity => {
      const selectedSubIds = selectedSubActivities[activity.id] || [];
      const selectedSubs = activity.subActivities.filter(sub => selectedSubIds.includes(sub.id));

      selectedSubs.forEach(sub => {
        allSubs.push({
          activityId: activity.id,
          subId: sub.id,
          activitySortingVar: activity.sorting_var || 0,
          currentStage: sub.sorting_var || 0,
          subData: sub
        });
      });
    });

    // Find the target sub-activity
    const targetIndex = allSubs.findIndex(s => s.subId === subId);
    if (targetIndex === -1) return;

    const target = allSubs[targetIndex];
    if (newStage === target.currentStage) return;

    // Remove target and insert at new position
    allSubs.splice(targetIndex, 1);
    allSubs.splice(newStage - 1, 0, target);

    // Sort by activity sorting_var first to maintain activity order, then by new stage
    allSubs.sort((a, b) => {
      if (a.activitySortingVar !== b.activitySortingVar) {
        return a.activitySortingVar - b.activitySortingVar;
      }
      return 0; // Keep relative order within same activity
    });

    // Reassign stages sequentially and get the reordered sub-activities per activity
    const updates = allSubs.map((sub, idx) => ({
      activityId: sub.activityId,
      subId: sub.subId,
      newStage: idx + 1
    }));

    // Group updates by activity to reorder the subActivities array
    const updatesByActivity = {};
    updates.forEach(update => {
      if (!updatesByActivity[update.activityId]) {
        updatesByActivity[update.activityId] = [];
      }
      updatesByActivity[update.activityId].push(update);
    });

    // Apply updates and reorder subActivities arrays
    Object.keys(updatesByActivity).forEach(actId => {
      const activityUpdates = updatesByActivity[actId];
      const activityObj = allSelectedActivities.find(a => a.id === actId);

      if (activityObj) {
        // Create new ordered subActivities array
        const allSubsForActivity = [...activityObj.subActivities];
        const updatedSubsMap = {};

        activityUpdates.forEach(update => {
          updatedSubsMap[update.subId] = update.newStage;
        });

        // Sort the subActivities by their new stage (selected ones) or keep original order for unselected
        const newOrder = [...allSubsForActivity].sort((a, b) => {
          const aStage = updatedSubsMap[a.id] !== undefined ? updatedSubsMap[a.id] : a.sorting_var || 999;
          const bStage = updatedSubsMap[b.id] !== undefined ? updatedSubsMap[b.id] : b.sorting_var || 999;
          return aStage - bStage;
        });

        const templateIndex = templatesActivities.findIndex(act => act.id === actId);

        if (templateIndex !== -1) {
          setTemplateActivities(prev =>
            prev.map(act => {
              if (act.id === actId) {
                return {
                  ...act,
                  subActivities: newOrder.map(sub => ({
                    ...sub,
                    sorting_var: updatedSubsMap[sub.id] !== undefined ? updatedSubsMap[sub.id] : sub.sorting_var
                  }))
                };
              }
              return act;
            })
          );
        } else {
          setCustomActivities(prev =>
            prev.map(act => {
              if (act.id === actId) {
                return {
                  ...act,
                  subActivities: newOrder.map(sub => ({
                    ...sub,
                    sorting_var: updatedSubsMap[sub.id] !== undefined ? updatedSubsMap[sub.id] : sub.sorting_var
                  }))
                };
              }
              return act;
            })
          );
        }
      }
    });

    // Close modal
    setEditingStage(null);
  };

  const getAllActivities = () => {
    // Ensure all activities have proper structure

    const normalizedTemplates = templatesActivities.map((activity) => ({
      ...activity,
      subActivities: activity.subActivities.map((sub) => ({
        ...sub,
        chainage_quantity: sub.chainage_quantity || sub.chainage_no || 1, // Ensure chainage_quantity exists
        chainage_start: sub.chainage_start || null,
        chainage_end: sub.chainage_end || null,
        covered_area: sub.covered_area || null,
        // lengthType: sub.lengthType || 'same',
        // chainageLengths: sub.chainageLengths || [],
        // isCustom: sub.isCustom || false,
        chainage_exist: sub.chainage_exist,
        planned_quantity_exist: sub.planned_quantity_exist,
        length_exist: sub.length_exist,
        submission_exist: sub.submission_exist,
        approval_exist: sub.approval_exist,
      })),
    }));

    const normalizedCustom = customActivities.map((activity) => ({
      ...activity,
      subActivities: activity.subActivities.map((sub) => ({
        ...sub,
        chainage_quantity: sub.chainage_quantity || sub.chainage_no || 1,
        chainage_start: sub.chainage_start || null,
        chainage_end: sub.chainage_end || null,
        covered_area: sub.covered_area || null,
        // lengthType: sub.lengthType || 'same',
        // chainageLengths: sub.chainageLengths || [],
        isCustom: sub.isCustom || true,
      })),
    }));

    return [...normalizedTemplates, ...normalizedCustom];
  };

  const validateDates = () => {
    const dates = [
      // { name: "Director Proposal", value: form.director_proposal_date },
      // { name: "Project Confirmation", value: form.project_confirmation_date },
      { name: "LOA", value: form.loa_date },
      { name: "Completion", value: form.completion_date },
    ];
    for (let i = 0; i < dates.length - 1; i++) {
      if (dates[i].value && dates[i + 1].value) {
        if (new Date(dates[i].value) > new Date(dates[i + 1].value)) {
          dispatch(
            showSnackbar({
              message: `${dates[i].name} date must be before ${dates[i + 1].name} date`,
              type: "error",
            }),
          );
          return false;
        }
      }
    }
    return true;
  };

  const validate = () => {
    const showError = (message) => {
      dispatch(
        showSnackbar({
          message,
          type: "error",
        })
      );
      return false;
    };

    // 🔹 Required Fields
    const missingFields = [];

    if (!form.project_code) missingFields.push("Project Code");
    if (!form.project_name) missingFields.push("Project Name");
    if (!form.short_name) missingFields.push("Short Name");
    if (!form.company) missingFields.push("Please select a Company");
    if (!form.sector) missingFields.push("Sector");
    if (!form.workorder_Amount) missingFields.push("Workorder Amount");
    if (!form.location) missingFields.push("Work location");
    if (!form.workorder_document) missingFields.push("Workorder Document");
    if (!form.clientbranch) missingFields.push("Please select a Client & branch");
    if (!form.assigned_to?.length) missingFields.push("Please select a Project Owner");
    if (!form.total_length || form.total_length <= 0) missingFields.push("Please enter a valid Total Length");
    if (!selectedActivities.length) missingFields.push("Please select at least one activity");

    if (missingFields.length) {
      return showError(`Please fill: ${missingFields.join(", ")}`);
    }



    // 🔹 Weightage Check
    const totalWeightage = Object.values(activityWeightages).reduce(
      (sum, w) => sum + (w || 0),
      0
    );

    if (Math.abs(totalWeightage - 100) > 0.01) {
      return showError(
        `Total activity weightage must be 100%. Current: ${totalWeightage}%`
      );
    }

    const allActivities = getAllActivities();

    // 🔹 Activity Validation
    for (const activityId of selectedActivities) {
      const activityObj = allActivities.find((a) => a.id === activityId);
      const activityLabel = activityObj?.activity_name || activityId;

      const dates = activityDates[activityId];

      // Dates check
      if (!dates?.startDate || !dates?.endDate) {
        return showError(`Please set start & end dates for ${activityLabel}`);
      }

      if (new Date(dates.startDate) > new Date(dates.endDate)) {
        return showError(`End date must be after start date for ${activityLabel}`);
      }

      // Sub-activity check
      const selectedSubs = selectedSubActivities[activityId] || [];

      if (!selectedSubs.length) {
        return showError(
          `Please select at least one sub-activity for ${activityLabel}`
        );
      }
    }

    // 🔹 Global Date Validation
    if (!validateDates()) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validate()) return;

    setIsSubmitting(true);

    dispatch(
      showSnackbar({
        message: "Creating project... This may take a moment.",
        type: "info",
      })
    );

    try {
      const allActivities = getAllActivities();

      // Build Activities + SubActivities together with sorting_var
      const activitiesPayload = selectedActivities.map((activityId) => {
        const activityObj = allActivities.find((a) => a.id === activityId);
        const dates = activityDates[activityId];
        const weightage = activityWeightages[activityId] || 0;
        const activitySortingVar = activityObj?.sorting_var || 0;

        const selectedSubs = selectedSubActivities[activityId] || [];

        const subactivities = selectedSubs.map((subId) => {
          const subObj = activityObj?.subActivities.find((s) => s.id === subId);

          const unit = subActivityUnits[`${activityId}_${subId}`] || subObj?.unit;
          const plannedQty = subActivityPlannedQtys[`${subId}_quantity`] || 0;
          const submissionpayment = subActivityPlannedQtys[`${subId}_subpayment`] || 0;
          const approvalpayment = subActivityPlannedQtys[`${subId}_approvalpayment`] || 0;
          const chainagestart = subActivityPlannedQtys[`${subId}_chainagestart`] || 0;
          const chainageend = subActivityPlannedQtys[`${subId}_chainageend`] || 0;
          const coveredarea = subActivityPlannedQtys[`${subId}_coveredarea`] || 0;
          const description = subActivityPlannedQtys[`${subId}_description`] || "";
          const isStatusBased = unit === "status";
          const subSortingVar = subObj?.sorting_var || 0;

          return {
            subactivity_name: subObj?.subactivity_name || String(subId),
            description: description,
            total_quantity: isStatusBased ? 1 : plannedQty,
            unit: isStatusBased ? "status" : unit,
            submission_payment: submissionpayment,
            approval_payment: approvalpayment,
            chainage_start: chainagestart,
            chainage_end: chainageend,
            covered_area: coveredarea || "0.00",
            sorting_var: subSortingVar
          };
        });

        return {
          activity_name: activityObj?.activity_name,
          start_date: dates.startDate,
          end_date: dates.endDate,
          weightage: weightage,
          sorting_var: activitySortingVar,
          subactivities: subactivities,
        };
      });

      // 🔥 Final Payload (same as your working API)
      const selectedCompany = companies.find((c) => c.name === form.company);

      const payload = {
        project_name: form.project_name,
        project_code: form.project_code,
        short_name: form.short_name,
        location: form.location,
        company: selectedCompany?.id || null,
        sub_company: null,
        total_length: parseFloat(form.total_length),
        workorder_cost: parseFloat(form.workorder_Amount) || 0,
        loa_date: form.loa_date,
        completion_date: form.completion_date,
        assigned_to: form.assigned_to,
        created_by: sessionStorage.getItem('emp_code'),
        gst_type: "exclude",
        igst: null,
        cgst: null,
        clientbranch: form.clientbranch,
        // members: [],
        director_proposal_date: form.director_proposal_date || null,
        project_confirmation_date: form.project_confirmation_date || null,
        sector: sectorsMap[form.sector] || null,
        client: form.client || null,
        activities: activitiesPayload,
        workorder_document: form.workorder_document
      };

      console.log('payload-', payload)

      const apiResult = await dispatch(createProjectApi(payload)).unwrap();
      // ✅ Success
      dispatch(
        showSnackbar({

          message: "Project created successfully!",
          type: "success",
        })
      );
      navigate("/all-projects");
    } catch (error) {
      console.error("Project creation error:", error);
      dispatch(
        showSnackbar({
          message: error?.message || "Failed to create project",
          type: "error",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   if (!validate()) return;
  //   setIsSubmitting(true);
  //   dispatch(
  //     showSnackbar({
  //       message: "Creating project... This may take a moment.",
  //       type: "info",
  //     }),
  //   );
  //   try {
  //     const allActivities = getAllActivities();
  //     let createdActivityIds = [];
  //     const activityIdMap = {};
  //     const activitiesPayload = selectedActivities.map((activityId) => {
  //       const dates = activityDates[activityId];
  //       const weightage = activityWeightages[activityId] || 0;
  //       return {
  //         activity_name: allActivities.find((a) => a.id === activityId)
  //           ?.activity_name,
  //         weightage: weightage,
  //         start_date: dates.startDate,
  //         end_date: dates.endDate,
  //         sorting_var: allActivities.find((a) => a.id === activityId)
  //           ?.sorting_var
  //       };
  //     });
  //     const activitiesResponse = await dispatch(
  //       createActivitiesBulk(activitiesPayload),
  //     ).unwrap();
  //     if (Array.isArray(activitiesResponse)) {
  //       createdActivityIds = activitiesResponse.map((act) => act.id);
  //       selectedActivities.forEach((actName, index) => {
  //         activityIdMap[actName] = activitiesResponse[index]?.id;
  //       });
  //     } else {
  //       createdActivityIds = [activitiesResponse.id];
  //       activityIdMap[selectedActivities[0]] = activitiesResponse.id;
  //     }
  //     const bulkSubPromises = [];

  //     for (const activityIdKey of selectedActivities) {
  //       const activityObj = allActivities.find((a) => a.id === activityIdKey);
  //       if (!activityObj) continue;

  //       const backendActivityId = activityIdMap[activityIdKey];
  //       const selectedSubs = selectedSubActivities[activityIdKey] || [];
  //       if (selectedSubs.length === 0) continue;

  //       const subActivitiesPayload = selectedSubs.map((subId) => {
  //         const subObj = activityObj.subActivities.find((s) => s.id === subId);
  //         const unit =
  //           subActivityUnits[`${activityIdKey}_${subId}`] || subObj?.unit;
  //         const plannedQty = subActivityPlannedQtys[`${subId}_quantity`] || 0;
  //         const submissionpayment =
  //           subActivityPlannedQtys[`${subId}_subpayment`] || 0;
  //         const approvalpayment =
  //           subActivityPlannedQtys[`${subId}_approvalpayment`] || 0;
  //         const chainagestart =
  //           subActivityPlannedQtys[`${subId}_chainagestart`] || 0;
  //         const chainageend =
  //           subActivityPlannedQtys[`${subId}_chainageend`] || 0;
  //         const description =
  //           subActivityPlannedQtys[`${subId}_description`] || "";
  //         const isStatusBased = unit === "status";

  //         return {
  //           subactivity_name: subObj?.subactivity_name || String(subId),
  //           unit: isStatusBased ? "status" : unit,
  //           total_quantity: isStatusBased ? 1 : plannedQty,
  //           range: isStatusBased ? "status" : null,
  //           activity: backendActivityId,
  //           submission_payment: submissionpayment,
  //           approval_payment: approvalpayment,
  //           chainage_start: chainagestart,
  //           chainage_end: chainageend,
  //           description: description,
  //           sorting_var: subObj?.sorting_var
  //         };
  //       });

  //       bulkSubPromises.push(
  //         dispatch(createSubActivitiesBulk(subActivitiesPayload)).unwrap(),
  //       );
  //     }

  //     if (bulkSubPromises.length > 0) {
  //       await Promise.all(bulkSubPromises);
  //     }

  //     const selectedCompany = companies.find((c) => c.name === form.company);
  //     const sectorId = sectorsMap[form.sector] || null;
  //     const clientId = form.client || null;
  //     const projectData = {
  //       project_code: form.project_code,
  //       project_name: form.project_name,
  //       short_name: form.short_name,
  //       company: selectedCompany?.id || null,
  //       sector: sectorId,
  //       clientbranch: form.clientbranch,
  //       client: clientId,
  //       sub_company: undefined,
  //       location: form.location,
  //       total_length: parseFloat(form.total_length),
  //       workorder_cost: parseFloat(form.workorder_Amount) || 0,
  //       igst_percentage: parseFloat(form.igst_percentage) || 0,
  //       cgst_percentage: parseFloat(form.cgst_percentage) || 0,
  //       director_proposal_date: form.director_proposal_date
  //         ? form.director_proposal_date
  //         : null,
  //       project_confirmation_date: form.project_confirmation_date
  //         ? form.project_confirmation_date
  //         : null,
  //       loa_date: form.loa_date,
  //       completion_date: form.completion_date,
  //       activities: createdActivityIds,
  //       assigned_to: form.assigned_to,
  //     };
  //     const apiResult = await dispatch(createProjectApi(projectData)).unwrap();
  //     // Doubt
  //     dispatch(
  //       addProject({
  //         id: apiResult.id || `temp_${Date.now()}`,
  //         code: form.project_code,
  //         name: form.project_name,
  //         shortName: form.short_name,
  //         company: form.company,
  //         location: form.location,
  //         sector: form.sector,
  //         department: form.client,
  //         totalLength: form.total_length,
  //         clientbranch: form.clientbranch,
  //         cost: form.workorder_Amount,
  //         directorProposalDate: form.director_proposal_date,
  //         projectConfirmationDate: form.project_confirmation_date,
  //         loaDate: form.loa_date,
  //         completionDate: form.completion_date,
  //         assigned_to: form.assigned_to,
  //         activities: selectedActivities.map((activityId, idx) => {
  //           const activityObj = allActivities.find((a) => a.id === activityId);
  //           const dates = activityDates[activityId];
  //           const selectedSubs = selectedSubActivities[activityId] || [];
  //           return {
  //             id: createdActivityIds[idx] || `a${idx + 1}_${Date.now()}`,
  //             sorting_var: activityObj?.sorting_var || idx + 1,
  //             activity_name: activityObj?.activity_name || activityId,
  //             weightage: activityWeightages[activityId] || 0,
  //             start_date: dates.startDate,
  //             end_date: dates.endDate,
  //             // progress: 0,
  //             subActivities: selectedSubs.map((subId, subIdx) => {
  //               const subObj = activityObj?.subActivities.find(
  //                 (s) => s.id === subId,
  //               );
  //               const key = subObj
  //                 ? `${subId}_${subObj.subactivity_name}`
  //                 : `${subId}_${activityId}`;
  //               const unit = subActivityUnits[key] || subObj?.unit;
  //               const plannedQty = subActivityPlannedQtys[key] || 0;

  //               return {
  //                 id: `s${idx + 1}_${subIdx + 1}_${Date.now()}`,
  //                 sorting_var: subObj?.sorting_var || subIdx + 1,
  //                 subactivity_name: subObj?.subactivity_name || subId,
  //                 unit: unit,
  //                 total_quantity: unit !== "status" ? plannedQty : 1,
  //                 // completedQty: 0,
  //                 // progress: 0,
  //                 chainage_start: subObj.chainage_start,
  //                 chainage_end: subObj.chainage_end,
  //                 covered_area: subObj.covered_area,
  //                 status: "Pending",
  //               };
  //             }),
  //           };
  //         }),
  //       }),
  //     );
  //     dispatch(
  //       showSnackbar({
  //         message: "Project created successfully!",
  //         type: "success",
  //       }),
  //     );
  //     navigate("/projects");
  //   } catch (error) {
  //     console.error("Project creation error:", error);
  //     let errorMessage = "Failed to create project";
  //     if (error.response?.data) {
  //       if (typeof error.response.data === "string") {
  //         errorMessage = error.response.data;
  //       } else if (error.response.data.message) {
  //         errorMessage = error.response.data.message;
  //       } else if (error.response.data.detail) {
  //         errorMessage = error.response.data.detail;
  //       } else {
  //         try {
  //           const errors = Object.entries(error.response.data)
  //             .map(
  //               ([field, msgs]) =>
  //                 `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`,
  //             )
  //             .join(", ");
  //           if (errors) errorMessage = errors;
  //         } catch {
  //           errorMessage = "Unknown error occurred";
  //         }
  //       }
  //     }
  //     dispatch(
  //       showSnackbar({
  //         message: errorMessage,
  //         type: "error",
  //       }),
  //     );
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const closeModal = (setter) => {
    setter(false);
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const totalWeightage = Object.values(activityWeightages).reduce(
    (sum, w) => sum + (w || 0),
    0,
  );
  const getUnitDisplay = (unit) => {
    if (unit === "status") return "Status";
    if (unit === "Km") return "Km";
    if (unit === "Nos.") return "Nos";
    if (unit === "Percentage") return "%";
    return unit;
  };


  // Add a ref to track if we're currently recalculating to avoid loops
  const isRecalculatingRef = useRef(false);

  // Single source of truth for recalculating all stages
  const recalculateAllStages = useCallback(() => {
    if (isRecalculatingRef.current) return;

    // Get all selected activities
    const allSelectedActivities = selectedActivities
      .map(id => getAllActivities().find(a => a.id === id))
      .filter(Boolean);

    // Collect all selected sub-activities across all activities
    let allSelectedSubs = [];

    allSelectedActivities.forEach(activity => {
      const selectedSubIds = selectedSubActivities[activity.id] || [];
      const selectedSubs = activity.subActivities.filter(sub => selectedSubIds.includes(sub.id));

      selectedSubs.forEach(sub => {
        allSelectedSubs.push({
          activityId: activity.id,
          subId: sub.id,
          activitySortingVar: activity.sorting_var || 0,
          subSortingVar: sub.sorting_var || 0,
          subData: sub
        });
      });
    });

    // Sort by activity sorting_var first, then by current sub stage
    allSelectedSubs.sort((a, b) => {
      if (a.activitySortingVar !== b.activitySortingVar) {
        return a.activitySortingVar - b.activitySortingVar;
      }
      return a.subSortingVar - b.subSortingVar;
    });

    // Check if any stage needs to change
    let needsUpdate = false;
    const updates = [];

    allSelectedSubs.forEach((sub, index) => {
      const expectedStage = index + 1;
      if (sub.subSortingVar !== expectedStage) {
        needsUpdate = true;
        updates.push({
          activityId: sub.activityId,
          subId: sub.subId,
          newStage: expectedStage
        });
      }
    });

    if (needsUpdate && !isRecalculatingRef.current) {
      isRecalculatingRef.current = true;

      // Apply updates
      updates.forEach(({ activityId, subId, newStage }) => {
        const templateIndex = templatesActivities.findIndex(act => act.id === activityId);

        if (templateIndex !== -1) {
          setTemplateActivities(prev =>
            prev.map(act => {
              if (act.id === activityId) {
                return {
                  ...act,
                  subActivities: act.subActivities.map(sub =>
                    sub.id === subId ? { ...sub, sorting_var: newStage } : sub
                  )
                };
              }
              return act;
            })
          );
        } else {
          setCustomActivities(prev =>
            prev.map(act => {
              if (act.id === activityId) {
                return {
                  ...act,
                  subActivities: act.subActivities.map(sub =>
                    sub.id === subId ? { ...sub, sorting_var: newStage } : sub
                  )
                };
              }
              return act;
            })
          );
        }
      });

      // Reset the flag after a short delay
      setTimeout(() => {
        isRecalculatingRef.current = false;
      }, 100);
    }
  }, [selectedActivities, selectedSubActivities, templatesActivities, customActivities]);

  // Recalculate stages whenever activities are selected/unselected or sub-activities change
  useEffect(() => {
    if (selectedActivities.length > 0) {
      recalculateAllStages();
    }
  }, [selectedActivities, selectedSubActivities, recalculateAllStages]);

  // Recalculate activity sorting_vars when activities are reordered
  const recalculateActivityStages = useCallback(() => {
    // Get all selected activities
    const allSelectedActivities = selectedActivities
      .map(id => getAllActivities().find(a => a.id === id))
      .filter(Boolean);

    // Sort by current sorting_var
    const sorted = [...allSelectedActivities].sort((a, b) =>
      (a.sorting_var || 0) - (b.sorting_var || 0)
    );

    // Check if any needs update
    let needsUpdate = false;
    const updates = [];

    sorted.forEach((activity, index) => {
      const expectedStage = index + 1;
      if ((activity.sorting_var || 0) !== expectedStage) {
        needsUpdate = true;
        updates.push({
          activityId: activity.id,
          newStage: expectedStage
        });
      }
    });

    if (needsUpdate) {
      updates.forEach(({ activityId, newStage }) => {
        const templateIndex = templatesActivities.findIndex(act => act.id === activityId);

        if (templateIndex !== -1) {
          setTemplateActivities(prev =>
            prev.map(act => {
              if (act.id === activityId) {
                return { ...act, sorting_var: newStage };
              }
              return act;
            })
          );
        } else {
          setCustomActivities(prev =>
            prev.map(act => {
              if (act.id === activityId) {
                return { ...act, sorting_var: newStage };
              }
              return act;
            })
          );
        }
      });
    }
  }, [selectedActivities, templatesActivities, customActivities]);

  // Recalculate activity stages when selected activities change
  useEffect(() => {
    if (selectedActivities.length > 0) {
      recalculateActivityStages();
    }
  }, [selectedActivities, recalculateActivityStages]);


  const debugStages = () => {
    const allSelectedActivities = selectedActivities
      .map(id => getAllActivities().find(a => a.id === id))
      .filter(Boolean);

    console.log("=== STAGE DEBUG ===");
    allSelectedActivities.forEach(activity => {
      const selectedSubIds = selectedSubActivities[activity.id] || [];
      const selectedSubs = activity.subActivities.filter(sub => selectedSubIds.includes(sub.id));

      console.log(`Activity: ${activity.activity_name} (sorting_var: ${activity.sorting_var})`);
      selectedSubs.forEach(sub => {
        console.log(`  - ${sub.subactivity_name}: stage ${sub.sorting_var}`);
      });
    });
    console.log("=================");
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-4 md:space-y-8 px-3 md:px-4 py-4 md:py-6"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Loading Overlay */}
      {(loading || isSubmitting) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            <p className="text-gray-700">
              {isSubmitting ? "Creating project..." : "Loading data..."}
            </p>
          </div>
        </div>
      )}
      {/* Add Sector Modal */}
      <AnimatePresence>
        {showAddSectorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => closeModal(setShowAddSectorModal)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg md:text-xl font-bold mb-4">
                Add New Sector
              </h3>
              <input
                type="text"
                placeholder="Enter sector name"
                value={newSector.name}
                onChange={(e) =>
                  setNewSector({ ...newSector, name: e.target.value })
                }
                className="w-full p-3 border rounded-xl text-sm md:text-base mb-4"
                autoFocus
              />
              <select
                name=""
                id=""
                placeholder="Enter unit"
                value={newSector.unit}
                onChange={(e) =>
                  setNewSector({ ...newSector, unit: e.target.value })
                }
                className="w-full p-3 border rounded-xl text-sm md:text-base mb-4"
                autoFocus
              >
                <option value="">Select Type</option>
                <option value="length">Length</option>
                <option value="area">Area</option>
                <option value="quantity">Quantity</option>
              </select>

              {/* <input
                type="text"
                placeholder="Enter sector name"
                value={newSector.unit}
                onChange={(e) => setNewSector({ ...newSector, unit: e.target.value })}
                className="w-full p-3 border rounded-xl text-sm md:text-base mb-4"
                autoFocus
              /> */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => closeModal(setShowAddSectorModal)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSector}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
                >
                  Add Sector
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Add Client Modal */}
      <AnimatePresence>
        {showAddClientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => closeModal(setShowAddClientModal)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-6">Add New Client</h3>

              {/* Company Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Client Code (P0001)"
                  className="p-3 border rounded-xl"
                  value={newClient.code}
                  onChange={(e) =>
                    setNewClient({ ...newClient, code: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Client Name"
                  className="p-3 border rounded-xl"
                  value={newClient.client_name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, client_name: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="PAN Number"
                  className="p-3 border rounded-xl"
                  maxLength={10}
                  value={newClient.pan_no}
                  onChange={(e) =>
                    setNewClient({ ...newClient, pan_no: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Contact Number"
                  className="p-3 border rounded-xl"
                  value={newClient.contact}
                  onChange={(e) =>
                    setNewClient({ ...newClient, contact: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Address"
                  className="p-3 border rounded-xl"
                  value={newClient.address}
                  onChange={(e) =>
                    setNewClient({ ...newClient, address: e.target.value })
                  }
                />
                <select
                  className="p-3 border rounded-xl"
                  value={newClient.status}
                  onChange={(e) =>
                    setNewClient({ ...newClient, status: e.target.value })
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>

              {/* Branch Section */}
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Branches</h4>

                {branches.map((branch, index) => (
                  <div
                    key={index}
                    className="border rounded-xl p-4 mb-4 bg-gray-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Branch Name"
                        value={branch.name}
                        onChange={(e) =>
                          handleBranchChange(index, "name", e.target.value)
                        }
                        className="p-2 border rounded-lg"
                      />

                      <input
                        type="text"
                        placeholder="GST Number"
                        value={branch.gst}
                        onChange={(e) =>
                          handleBranchChange(index, "gst", e.target.value)
                        }
                        className="p-2 border rounded-lg"
                      />

                      <input
                        type="text"
                        placeholder="State"
                        value={branch.state}
                        onChange={(e) =>
                          handleBranchChange(index, "state", e.target.value)
                        }
                        className="p-2 border rounded-lg"
                      />

                      <select
                        value={branch.status}
                        onChange={(e) =>
                          handleBranchChange(index, "status", e.target.value)
                        }
                        className="p-2 border rounded-lg"
                      >
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>

                    {index > 0 && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => removeBranch(index)}
                          className="text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={addBranch}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  + Add Branch
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => closeModal(setShowAddClientModal)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Save Client
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Company Modal */}
      <AnimatePresence>
        {showAddCompanyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddCompanyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg md:text-xl font-bold mb-4">
                Add New Company
              </h3>
              <input
                type="text"
                placeholder="Enter company name"
                value={newCompany?.name}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, name: e.target.value })
                }
                className="w-full p-3 border rounded-xl text-sm md:text-base mb-4"
                autoFocus
              />
              <input
                type="text"
                placeholder="Enter company PAN No."
                value={newCompany?.pan_no}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, pan_no: e.target.value })
                }
                className="w-full p-3 border rounded-xl text-sm md:text-base mb-4"
                autoFocus
              />
              <input
                type="text"
                placeholder="Enter company GST No."
                value={newCompany?.gst_no}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, gst_no: e.target.value })
                }
                className="w-full p-3 border rounded-xl text-sm md:text-base mb-4"
                autoFocus
              />
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCompany}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
                >
                  Add Company
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Add Activity Modal - Original */}
      <AnimatePresence>
        {showAddActivityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => closeModal(setShowAddActivityModal)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-4 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleAddActivity}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg md:text-xl font-bold">
                    Add New Activity
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      closeModal(setShowAddActivityModal);
                      setNewActivityName("");
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter activity name"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="w-full p-2.5 md:p-3 border rounded-xl text-sm md:text-base mb-4"
                  autoFocus
                />
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeModal(setShowAddActivityModal);
                      setNewActivityName("");
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
                  >
                    Add Activity
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Sub-Activity Modal - Original */}
      <AnimatePresence>
        {showAddSubActivityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => closeModal(setShowAddSubActivityModal)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-4 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleAddSubActivity}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg md:text-xl font-bold">
                    Add Sub-Activity
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      closeModal(setShowAddSubActivityModal);
                      setNewSubActivity({
                        subactivity_name: "",
                        unit: "Km",
                        chainage_start: "",
                        covered_area: "",
                        chainage_quantity: "",
                        activityType: "single",
                        lengthType: "same", // 'same' or 'different'
                        chainageLengths: [],
                      });
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {/* Activity Name Display */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity:{" "}
                      <span className="text-blue-600">
                        {
                          getAllActivities().find(
                            (a) => a.id === selectedActivityForSub,
                          )?.activity_name
                        }
                      </span>
                    </label>
                  </div>

                  {/* Activity Type Toggle */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setNewSubActivity({
                          ...newSubActivity,
                          activityType: "single",
                          lengthType: "same",
                          chainageLengths: [],
                        })
                      }
                      className={`flex-1 px-4 py-2 rounded-lg transition-all ${newSubActivity.activityType === "single"
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Single
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewSubActivity({
                          ...newSubActivity,
                          activityType: "multiple",
                          lengthType: "same",
                          chainageLengths: [],
                        })
                      }
                      className={`flex-1 px-4 py-2 rounded-lg transition-all ${newSubActivity.activityType === "multiple"
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Multiple
                    </button>
                  </div>

                  {/* Common Fields */}
                  <input
                    type="text"
                    placeholder="Sub-activity name *"
                    value={newSubActivity.subactivity_name}
                    onChange={(e) =>
                      setNewSubActivity({
                        ...newSubActivity,
                        subactivity_name: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />

                  <select
                    value={newSubActivity.unit}
                    onChange={(e) =>
                      setNewSubActivity({
                        ...newSubActivity,
                        unit: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {UNIT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {/* Multiple Chainage Fields */}
                  {newSubActivity.activityType === "multiple" && (
                    <div className="space-y-4 border-t pt-4">
                      {/* Start Chainage */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Chainage *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newSubActivity.chainage_start}
                          onChange={(e) =>
                            setNewSubActivity({
                              ...newSubActivity,
                              chainage_start: e.target.value,
                            })
                          }
                          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Chainages *
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Enter quantity"
                          value={newSubActivity.chainage_quantity}
                          onChange={(e) => {
                            const qty = e.target.value;
                            setNewSubActivity({
                              ...newSubActivity,
                              chainage_quantity: qty,
                              chainageLengths: new Array(Number(qty)).fill(""),
                            });
                          }}
                          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* Length Type Selection */}
                      {newSubActivity.chainage_quantity &&
                        Number(newSubActivity.chainage_quantity) > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Length Type
                            </label>
                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() =>
                                  setNewSubActivity({
                                    ...newSubActivity,
                                    lengthType: "same",
                                    chainageLengths: [],
                                  })
                                }
                                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${newSubActivity.lengthType === "same"
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                              >
                                Same Length
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setNewSubActivity({
                                    ...newSubActivity,
                                    lengthType: "different",
                                    chainageLengths: new Array(
                                      Number(newSubActivity.chainage_quantity),
                                    ).fill(""),
                                  })
                                }
                                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${newSubActivity.lengthType === "different"
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                              >
                                Different Lengths
                              </button>
                            </div>
                          </div>
                        )}

                      {/* Same Length Input */}
                      {newSubActivity.lengthType === "same" &&
                        newSubActivity.chainage_quantity && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Chainage Length *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Enter length"
                              value={newSubActivity.covered_area}
                              onChange={(e) =>
                                setNewSubActivity({
                                  ...newSubActivity,
                                  covered_area: e.target.value,
                                })
                              }
                              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        )}

                      {/* Different Lengths - Table Preview */}
                      {newSubActivity.lengthType === "different" &&
                        newSubActivity.chainage_quantity && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chainage Lengths *
                            </label>
                            <div className="border rounded-xl overflow-hidden">
                              <div className="bg-gray-50 px-3 py-2 border-b">
                                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600">
                                  <div className="col-span-2">S.No.</div>
                                  <div className="col-span-5">
                                    Start Chainage
                                  </div>
                                  <div className="col-span-5">Length (km)</div>
                                </div>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {Array.from({
                                  length: Number(
                                    newSubActivity.chainage_quantity,
                                  ),
                                }).map((_, idx) => {
                                  const startValue =
                                    idx === 0
                                      ? Number(newSubActivity.chainage_start) ||
                                      0
                                      : (() => {
                                        let sum =
                                          Number(
                                            newSubActivity.chainage_start,
                                          ) || 0;
                                        for (let i = 0; i < idx; i++) {
                                          sum +=
                                            Number(
                                              newSubActivity.chainageLengths[
                                              i
                                              ],
                                            ) || 0;
                                        }
                                        return sum;
                                      })();

                                  return (
                                    <div
                                      key={idx}
                                      className="grid grid-cols-12 gap-2 p-2 border-b last:border-b-0 items-center"
                                    >
                                      <div className="col-span-2 text-sm text-gray-600">
                                        {idx + 1}
                                      </div>
                                      <div className="col-span-5 text-sm text-gray-600">
                                        {startValue.toFixed(2)}
                                      </div>
                                      <div className="col-span-5">
                                        <input
                                          type="number"
                                          step="0.01"
                                          placeholder="Length"
                                          value={
                                            newSubActivity.chainageLengths[
                                            idx
                                            ] || ""
                                          }
                                          onChange={(e) => {
                                            const newLengths = [
                                              ...newSubActivity.chainageLengths,
                                            ];
                                            newLengths[idx] = e.target.value;
                                            setNewSubActivity({
                                              ...newSubActivity,
                                              chainageLengths: newLengths,
                                            });
                                          }}
                                          className="w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            {/* Preview End Chainage */}
                            <div className="mt-2 text-right text-xs text-gray-500">
                              Final Chainage:{" "}
                              {(() => {
                                let total =
                                  Number(newSubActivity.chainage_start) || 0;
                                newSubActivity.chainageLengths.forEach(
                                  (len) => {
                                    total += Number(len) || 0;
                                  },
                                );
                                return total.toFixed(2);
                              })()}
                            </div>
                          </div>
                        )}

                      {/* Preview for Same Length */}
                      {newSubActivity.lengthType === "same" &&
                        newSubActivity.chainage_quantity &&
                        newSubActivity.covered_area && (
                          <div className="bg-blue-50 rounded-xl p-3">
                            <p className="text-xs font-medium text-blue-700 mb-2">
                              Preview:
                            </p>
                            <div className="space-y-1 text-xs text-gray-600">
                              {Array.from({
                                length: Math.min(
                                  Number(newSubActivity.chainage_quantity),
                                  5,
                                ),
                              }).map((_, idx) => {
                                const start =
                                  idx === 0
                                    ? Number(newSubActivity.chainage_start) || 0
                                    : (Number(newSubActivity.chainage_start) ||
                                      0) +
                                    idx *
                                    (Number(newSubActivity.covered_area) ||
                                      0);
                                const end =
                                  start +
                                  (Number(newSubActivity.covered_area) || 0);
                                return (
                                  <div
                                    key={idx}
                                    className="flex justify-between"
                                  >
                                    <span>Chainage {idx + 1}:</span>
                                    <span>
                                      {start.toFixed(2)} km → {end.toFixed(2)}{" "}
                                      km
                                    </span>
                                  </div>
                                );
                              })}
                              {Number(newSubActivity.chainage_quantity) > 5 && (
                                <div className="text-gray-400 text-center pt-1">
                                  +{" "}
                                  {Number(newSubActivity.chainage_quantity) - 5}{" "}
                                  more chainages
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      closeModal(setShowAddSubActivityModal);
                      setNewSubActivity({
                        subactivity_name: "",
                        unit: "Km",
                        chainage_start: "",
                        covered_area: "",
                        chainage_quantity: "",
                        activityType: "single",
                        lengthType: "same", // 'same' or 'different'
                        chainageLengths: [],
                      });
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Sub-Activity
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clone Sub-Activity Modal */}
      <AnimatePresence>
        {showCloneSubActivityModal && cloningSubActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCloneSubActivityModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-4 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleCloneSubActivitySubmit}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg md:text-xl font-bold">
                    Add Similar Sub-Activity
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCloneSubActivityModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {/* Activity Name Display */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity:{" "}
                      <span className="text-blue-600">
                        {
                          getAllActivities().find(
                            (a) => a.id === cloningSubActivity.activityId,
                          )?.activity_name
                        }
                      </span>
                    </label>
                  </div>

                  {/* Activity Type Toggle - Editable */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setCloningSubActivity({
                          ...cloningSubActivity,
                          activityType: "single",
                          lengthType: "same",
                          chainageLengths: [],
                        })
                      }
                      className={`flex-1 px-4 py-2 rounded-lg transition-all ${cloningSubActivity.activityType === "single"
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Single
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCloningSubActivity({
                          ...cloningSubActivity,
                          activityType: "multiple",
                          lengthType: "same",
                          chainageLengths: [],
                        })
                      }
                      className={`flex-1 px-4 py-2 rounded-lg transition-all ${cloningSubActivity.activityType === "multiple"
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Multiple
                    </button>
                  </div>

                  {/* Sub-Activity Name - READ ONLY */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sub-Activity Name *
                    </label>
                    <input
                      type="text"
                      value={cloningSubActivity.subactivity_name}
                      disabled
                      className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Unit - READ ONLY */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select
                      value={cloningSubActivity.unit}
                      disabled
                      className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                    >
                      {UNIT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Multiple Chainage Fields - Fully Editable */}
                  {cloningSubActivity.activityType === "multiple" && (
                    <div className="space-y-4 border-t pt-4">
                      {/* Start Chainage */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Chainage *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={cloningSubActivity.chainage_start}
                          onChange={(e) =>
                            setCloningSubActivity({
                              ...cloningSubActivity,
                              chainage_start: e.target.value,
                            })
                          }
                          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Chainages *
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Enter quantity"
                          value={cloningSubActivity.chainage_quantity}
                          onChange={(e) => {
                            const qty = e.target.value;
                            setCloningSubActivity({
                              ...cloningSubActivity,
                              chainage_quantity: qty,
                              chainageLengths: new Array(Number(qty)).fill(""),
                            });
                          }}
                          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      {/* Length Type Selection */}
                      {cloningSubActivity.chainage_quantity &&
                        Number(cloningSubActivity.chainage_quantity) > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Length Type
                            </label>
                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() =>
                                  setCloningSubActivity({
                                    ...cloningSubActivity,
                                    lengthType: "same",
                                    chainageLengths: [],
                                  })
                                }
                                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${cloningSubActivity.lengthType === "same"
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                              >
                                Same Length
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCloningSubActivity({
                                    ...cloningSubActivity,
                                    lengthType: "different",
                                    chainageLengths: new Array(
                                      Number(
                                        cloningSubActivity.chainage_quantity,
                                      ),
                                    ).fill(""),
                                  })
                                }
                                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${cloningSubActivity.lengthType === "different"
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                              >
                                Different Lengths
                              </button>
                            </div>
                          </div>
                        )}

                      {/* Same Length Input */}
                      {cloningSubActivity.lengthType === "same" &&
                        cloningSubActivity.chainage_quantity && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Chainage Length *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Enter length"
                              value={cloningSubActivity.covered_area}
                              onChange={(e) =>
                                setCloningSubActivity({
                                  ...cloningSubActivity,
                                  covered_area: e.target.value,
                                })
                              }
                              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        )}

                      {/* Different Lengths - Table Preview */}
                      {cloningSubActivity.lengthType === "different" &&
                        cloningSubActivity.chainage_quantity && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chainage Lengths *
                            </label>
                            <div className="border rounded-xl overflow-hidden">
                              <div className="bg-gray-50 px-3 py-2 border-b">
                                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600">
                                  <div className="col-span-2">S.No.</div>
                                  <div className="col-span-5">
                                    Start Chainage
                                  </div>
                                  <div className="col-span-5">Length (km)</div>
                                </div>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {Array.from({
                                  length: Number(
                                    cloningSubActivity.chainage_quantity,
                                  ),
                                }).map((_, idx) => {
                                  const startValue =
                                    idx === 0
                                      ? Number(
                                        cloningSubActivity.chainage_start,
                                      ) || 0
                                      : (() => {
                                        let sum =
                                          Number(
                                            cloningSubActivity.chainage_start,
                                          ) || 0;
                                        for (let i = 0; i < idx; i++) {
                                          sum +=
                                            Number(
                                              cloningSubActivity
                                                .chainageLengths[i],
                                            ) || 0;
                                        }
                                        return sum;
                                      })();

                                  return (
                                    <div
                                      key={idx}
                                      className="grid grid-cols-12 gap-2 p-2 border-b last:border-b-0 items-center"
                                    >
                                      <div className="col-span-2 text-sm text-gray-600">
                                        {idx + 1}
                                      </div>
                                      <div className="col-span-5 text-sm text-gray-600">
                                        {startValue.toFixed(2)}
                                      </div>
                                      <div className="col-span-5">
                                        <input
                                          type="number"
                                          step="0.01"
                                          placeholder="Length"
                                          value={
                                            cloningSubActivity.chainageLengths[
                                            idx
                                            ] || ""
                                          }
                                          onChange={(e) => {
                                            const newLengths = [
                                              ...cloningSubActivity.chainageLengths,
                                            ];
                                            newLengths[idx] = e.target.value;
                                            setCloningSubActivity({
                                              ...cloningSubActivity,
                                              chainageLengths: newLengths,
                                            });
                                          }}
                                          className="w-full px-2 py-1 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            {/* Preview End Chainage */}
                            <div className="mt-2 text-right text-xs text-gray-500">
                              Final Chainage:{" "}
                              {(() => {
                                let total =
                                  Number(cloningSubActivity.chainage_start) ||
                                  0;
                                cloningSubActivity.chainageLengths.forEach(
                                  (len) => {
                                    total += Number(len) || 0;
                                  },
                                );
                                return total.toFixed(2);
                              })()}
                            </div>
                          </div>
                        )}

                      {/* Preview for Same Length */}
                      {cloningSubActivity.lengthType === "same" &&
                        cloningSubActivity.chainage_quantity &&
                        cloningSubActivity.covered_area && (
                          <div className="bg-blue-50 rounded-xl p-3">
                            <p className="text-xs font-medium text-blue-700 mb-2">
                              Preview:
                            </p>
                            <div className="space-y-1 text-xs text-gray-600">
                              {Array.from({
                                length: Math.min(
                                  Number(cloningSubActivity.chainage_quantity),
                                  5,
                                ),
                              }).map((_, idx) => {
                                const start =
                                  idx === 0
                                    ? Number(
                                      cloningSubActivity.chainage_start,
                                    ) || 0
                                    : (Number(
                                      cloningSubActivity.chainage_start,
                                    ) || 0) +
                                    idx *
                                    (Number(
                                      cloningSubActivity.covered_area,
                                    ) || 0);
                                const end =
                                  start +
                                  (Number(cloningSubActivity.covered_area) ||
                                    0);
                                return (
                                  <div
                                    key={idx}
                                    className="flex justify-between"
                                  >
                                    <span>Chainage {idx + 1}:</span>
                                    <span>
                                      {start.toFixed(2)} km → {end.toFixed(2)}{" "}
                                      km
                                    </span>
                                  </div>
                                );
                              })}
                              {Number(cloningSubActivity.chainage_quantity) >
                                5 && (
                                  <div className="text-gray-400 text-center pt-1">
                                    +{" "}
                                    {Number(
                                      cloningSubActivity.chainage_quantity,
                                    ) - 5}{" "}
                                    more chainages
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCloneSubActivityModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Sub-Activity
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Activity Stage Modal */}
      <AnimatePresence>
        {editingActivityStage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingActivityStage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-4 md:p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold">
                  Edit Activity Sequence
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingActivityStage(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity
                  </label>
                  <p className="text-gray-600 bg-gray-50 p-2 rounded-lg">
                    {getAllActivities()
                      .find(a => a.id === editingActivityStage.activityId)
                      ?.activity_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sequence Order *
                  </label>
                  <select
                    value={editingActivityStage.currentStage || 1}
                    onChange={(e) => {
                      const newStage = parseInt(e.target.value);
                      handleActivityOrderChange(editingActivityStage.activityId, newStage);
                    }}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {getAvailableStagesForActivity(editingActivityStage.activityId).map(stage => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    Stages must be unique across all activities in the project
                  </p> */}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingActivityStage(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Stage Modal */}
      <AnimatePresence>
        {editingStage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingStage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-4 md:p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold">
                  Edit Stage Number
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingStage(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Activity
                  </label>
                  <p className="text-gray-600 bg-gray-50 p-2 rounded-lg">
                    {getAllActivities()
                      .find(a => a.id === editingStage.activityId)
                      ?.subActivities.find(s => s.id === editingStage.subId)
                      ?.subactivity_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage Number *
                  </label>
                  <select
                    value={editingStage.currentStage || 1}
                    onChange={(e) => {
                      const newStage = parseInt(e.target.value);
                      handleStageChange(editingStage.activityId, editingStage.subId, newStage);
                    }}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {getAvailableStagesForSubactivity(editingStage.activityId, editingStage.subId).map(stage => (
                      <option key={stage} value={stage}>
                        Stage {stage}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Stages must be unique across all sub-activities in the project
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingStage(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Sub-Activity Modal */}
      <AnimatePresence>
        {showEditSubActivityModal && editingSubActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditSubActivityModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-4 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleUpdateSubActivity}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg md:text-xl font-bold">
                    Edit Sub-Activity
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowEditSubActivityModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity:{" "}
                      <span className="text-blue-600">
                        {
                          getAllActivities().find(
                            (a) => a.id === editingSubActivity.activityId,
                          )?.activity_name
                        }
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSubActivity({
                          ...editingSubActivity,
                          activityType: "single",
                        })
                      }
                      className={`px-4 py-2 rounded-lg ${editingSubActivity.activityType === "single"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                        }`}
                    >
                      Single
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSubActivity({
                          ...editingSubActivity,
                          activityType: "multiple",
                        })
                      }
                      className={`px-4 py-2 rounded-lg ${editingSubActivity.activityType === "multiple"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                        }`}
                    >
                      Multiple
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Sub-activity name"
                    value={editingSubActivity.subactivity_name}
                    onChange={(e) =>
                      setEditingSubActivity({
                        ...editingSubActivity,
                        subactivity_name: e.target.value,
                      })
                    }
                    className="w-full p-2.5 border rounded-xl text-sm"
                    required
                  />

                  <select
                    value={editingSubActivity.unit}
                    onChange={(e) =>
                      setEditingSubActivity({
                        ...editingSubActivity,
                        unit: e.target.value,
                      })
                    }
                    className="w-full p-2.5 border rounded-xl text-sm"
                  >
                    {UNIT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {editingSubActivity.activityType === "multiple" && (
                    <>
                      <input
                        type="text"
                        placeholder="Start Chainage"
                        value={editingSubActivity.chainage_start}
                        onChange={(e) =>
                          setEditingSubActivity({
                            ...editingSubActivity,
                            chainage_start: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border rounded-xl text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Chainage Length"
                        value={editingSubActivity.covered_area}
                        onChange={(e) =>
                          setEditingSubActivity({
                            ...editingSubActivity,
                            covered_area: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border rounded-xl text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={editingSubActivity.chainage_quantity}
                        onChange={(e) =>
                          setEditingSubActivity({
                            ...editingSubActivity,
                            chainage_quantity: e.target.value,
                          })
                        }
                        className="w-full p-2.5 border rounded-xl text-sm"
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditSubActivityModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Sub-Activity
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Mobile Step Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create New Project
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1 flex items-center gap-1">
            <AlertCircle size={14} />
            Fields marked with * are required
          </p>
        </div>
        {isMobile && (
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
              initial={{ width: "33.33%" }}
              animate={{ width: `${(currentStep / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        {/* Step 1: Basic Information */}
        <motion.div
          initial={false}
          animate={{
            display: !isMobile || currentStep === 1 ? "block" : "none",
            opacity: !isMobile || currentStep === 1 ? 1 : 0,
          }}
          className="bg-white rounded-xl md:rounded-3xl shadow-lg md:shadow-2xl p-4 md:p-8 border border-gray-100"
        >
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            <span>Basic Information</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Project Code */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Project Code *</label>
              <div className="relative">
                <Hash
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  name="project_code"
                  value={form.project_code}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {/* Project Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Project Name *</label>
              <div className="relative">
                <Briefcase
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  name="project_name"
                  value={form.project_name}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {/* Short Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Short Name *</label>
              <div className="relative">
                <ALargeSmall
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                {/* <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔤</span> */}
                <input
                  type="text"
                  name="short_name"
                  value={form.short_name}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {/* Location */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Location *</label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Company *</label>
              <div className="relative">
                <Building2
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <select
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  className="w-full pl-9 pr-10 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.name}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-10"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            {form.company && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Company GST</label>
                <div className="relative">
                  <IdCard
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    name="gst_no"
                    disabled
                    value={
                      companies.filter((data) => data?.name == form.company)[0]
                        ?.gst_no
                    }
                    onChange={handleChange}
                    className="cursor-not-allowed w-full pl-9 pr-3 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Sector *</label>
              <div className="relative">
                <Factory
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <select
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  className="w-full pl-9 pr-10 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">Select Sector</option>
                  {sectorsList.map((sector, i) => (
                    <option key={i} value={sector?.name}>
                      {sector?.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddSectorModal(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Client *</label>
              <div
                className="relative"
                ref={clientDropdownRef}
                onClick={(e) => e.stopPropagation()}
              >
                <Handshake
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />

                <input
                  type="text"
                  value={clientSearch}
                  placeholder="Select Client"
                  onFocus={() => setShowClientDropdown(true)}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  className="w-full pl-9 pr-16 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddClientModal(true);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <Plus size={14} />
                </button>
                {showClientDropdown && (
                  <div className="absolute z-[9999] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {(clientSearch
                      ? clients.filter((c) =>
                        c.client_name
                          ?.toLowerCase()
                          .includes(clientSearch?.toLowerCase()),
                      )
                      : clients
                    ).length > 0 ? (
                      (clientSearch
                        ? clients.filter((c) =>
                          c.client_name
                            ?.toLowerCase()
                            .includes(clientSearch?.toLowerCase()),
                        )
                        : clients
                      ).map((client) => (
                        <div
                          key={client.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm({
                              ...form,
                              client: client.id,
                            });
                            setClientSearch(
                              `${client.client_name} - ${client.client_code || "N/A"}`,
                            ); // show both
                            // setClientSearch(client.client_name);
                            setShowClientDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        >
                          {client.client_name} - {client.client_code || "N/A"}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-400 text-sm">
                        No Matching Clients
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {form.client && (
              <>
                {/* <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">Client PAN</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      name="location"
                      disabled
                      value={(clients.filter((data) => data?.id == form.client)[0]?.pan_no)}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div> */}

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">Branch *</label>
                  <div className="relative">
                    <MapPinned
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <select
                      name="clientbranch"
                      value={form.clientbranch}
                      onChange={handleChange}
                      className="w-full pl-9 pr-10 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Select Branch</option>
                      {clients
                        .filter((data) => data?.id == form.client)[0]
                        ?.branches?.map((branch, i) => (
                          <option key={i} value={branch?.gst}>
                            {branch?.name} - {branch?.state}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {form.clientbranch && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Client GST</label>
                <div className="relative">
                  <IdCard
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    name="location"
                    disabled
                    value={
                      clients
                        .filter((data) => data?.id == form.client)[0]
                        ?.branches.filter(
                          (data) => data.gst == form.clientbranch,
                        )[0]?.gst
                    }
                    onChange={handleChange}
                    className="cursor-not-allowed w-full pl-9 pr-3 h-11 border border-gray-200 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            )}


            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                Workorder Document *
              </label>

              <label className="relative flex items-center cursor-pointer hover:border-blue-500 transition w-full pl-9 pr-3 h-11 border border-gray-200 rounded-lg bg-gray-50">
                <Upload
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <div className=" text-gray-500">
                  <span className="text-sm">
                    {form?.workorder_document?.[0]?.name || "Click to upload or drag & drop"}
                  </span>
                  {/* <span className="text-xs text-gray-400">PDF, DOC, JPG (Max 5MB)</span> */}
                </div>

                <input
                  type="file"
                  name="workorder_document"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">
                Assign Project Owners *
              </label>

              <div
                className="relative border rounded-lg px-3 pt-2 min-h-11 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 border-gray-200"
                ref={ReportingHeadsDropdownRef}
              >
                {/* Selected Users */}
                {
                  form.assigned_to.length > 0 &&
                  <div className="flex flex-wrap gap-2 mb-1">
                    {form.assigned_to?.map((userCode) => {
                      const user = reportingHeads.find(u => u.emp_code === userCode);

                      return user ? (
                        <div
                          key={userCode}
                          className="flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded-full"
                        >
                          {/* Avatar */}
                          {/* <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-medium">
                            {user.name?.charAt(0)}
                          </div> */}
                          {/* Avatar with Profile Picture Support */}
                          {user.profilepic ? (
                            <CustomImageModal customStyle>
                              <img
                                src={`${IMAGE_URL}${user.profilepic}`}
                                alt={user.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            </CustomImageModal>
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-medium">
                              {user.name?.charAt(0)}
                            </div>
                          )}

                          {/* Name + Code */}
                          <div className="flex flex-col leading-tight">
                            <span className="text-xs font-medium text-gray-800">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {user.emp_code}
                            </span>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => {
                              setForm({
                                ...form,
                                assigned_to: form.assigned_to.filter(u => u !== userCode),
                              });
                            }}
                            className="ml-1 text-gray-400 hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                }

                {/* Input */}
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />

                  <input
                    type="text"
                    value={reportingHeadSearch}
                    placeholder="Search by name or code..."
                    onFocus={() => setShowSupervisorDropdown(true)}
                    onChange={(e) => {
                      setReportingHeadSearch(e.target.value);
                      setShowSupervisorDropdown(true);
                    }}
                    className="flex-1 outline-none text-sm py-1"
                  />
                </div>

                {/* Dropdown */}
                {showSupervisorDropdown && (
                  <div className="absolute z-50 mt-2 w-full bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto border-gray-200 left-0">
                    {(() => {
                      const availableUsers = reportingHeads.filter(
                        user => !form.assigned_to?.includes(user.emp_code)
                      );

                      const filteredUsers = reportingHeadSearch
                        ? availableUsers.filter(
                          (u) =>
                            u.name?.toLowerCase().includes(reportingHeadSearch.toLowerCase()) ||
                            u.emp_code?.toLowerCase().includes(reportingHeadSearch.toLowerCase())
                        )
                        : availableUsers;

                      return filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setForm({
                                ...form,
                                assigned_to: [...(form.assigned_to || []), user.emp_code],
                              });

                              setReportingHeadSearch("");
                            }}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 cursor-pointer"
                          >
                            {/* Avatar */}
                            {/* <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-xs font-medium">
                              {user.name?.charAt(0)}
                            </div> */}
                            {/* Avatar with Profile Picture Support */}
                            {user.profilepic ? (
                              <img
                                src={`${IMAGE_URL}${user.profilepic}`}
                                alt={user.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-xs font-medium">
                                {user.name?.charAt(0)}
                              </div>
                            )}

                            {/* Name + Code */}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800">
                                {user.name}

                                <span className="text-xs text-gray-500"> ( {user.emp_code} )</span>
                              </span>
                            </div>

                            <Plus size={14} className="ml-auto text-blue-500" />
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-400 text-sm">
                          {availableUsers.length === 0
                            ? "No Supervisors Selected"
                            : "No results found"}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400">
                Select multiple supervisors. Click × to remove.
              </p>
            </div>


            {/* <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Assigned to</label>
              <div className="relative">
                <UserPen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  className="w-full pl-9 pr-10 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">Select Sector</option>
                  {sectorsList.map((sector, i) => (
                    <option key={i} value={sector}>{sector}</option>
                  ))}
                </select>

              </div>
            </div> */}
          </div>
        </motion.div>
        {/* Step 2: Project Specifications & Dates */}
        <motion.div
          initial={false}
          animate={{
            display: !isMobile || currentStep === 2 ? "block" : "none",
            opacity: !isMobile || currentStep === 2 ? 1 : 0,
          }}
          className="bg-white rounded-xl md:rounded-3xl shadow-lg md:shadow-2xl p-4 md:p-8 border border-gray-100"
        >
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-green-600 rounded-full"></div>
            <span>Project Specifications & Dates</span>
            {isMobile && (
              <span className="text-xs text-gray-500 ml-auto">Step 2/3</span>
            )}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Total Length */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 capitalize">
                Total{" "}
                {sectorsList.find(
                  (data) =>
                    data?.name.toLowerCase() === form.sector.toLowerCase(),
                )?.unit || ""}{" "}
                *
              </label>
              <div className="relative">
                <Ruler
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="number"
                  name="total_length"
                  step="0.01"
                  value={form.total_length}
                  onChange={handleChange}
                  className="w-full pl-9 pr-10 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                  {/* {sectorsList.find((data) => data?.name.toLowerCase() === form.sector.toLowerCase())?.unit || ''} */}
                  {SECTOR_UNIT_MAPPING[
                    sectorsList.find(
                      (data) =>
                        data?.name.toLowerCase() === form.sector.toLowerCase(),
                    )?.unit
                  ] || ""}
                  {/* Kms */}
                </span>
              </div>
            </div>

            {/* Workorder Cost */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Workorder Amount *</label>
              <div className="relative">
                <IndianRupee
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="number"
                  name="workorder_Amount"
                  value={form.workorder_Amount}
                  onChange={handleChange}
                  className="w-full pl-9 pr-10 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                  Lakhs
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">GST (%)</label>
              <div className="relative">
                <BadgePercent
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="number"
                  name="igst_percentage"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.igst_percentage}
                  onChange={handleChange}
                  className="w-full pl-9 pr-10 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                  <Percent className=" text-gray-400" size={16} />
                </span>
              </div>
            </div>
            {/* <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">CGST (%)</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="number"
                  name="cgst_percentage"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.cgst}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div> */}

            {/* Director Proposal Date */}
            {/* <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={12} /> Director Proposal Date *
              </label>
              <input
                type="date"
                name="director_proposal_date"
                value={form.director_proposal_date}
                onChange={handleChange}
                className="w-full px-3 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div> */}
            {/* Project Confirmation Date */}
            {/* <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={12} /> Project Confirmation Date *
              </label>
              <input
                type="date"
                name="project_confirmation_date"
                value={form.project_confirmation_date}
                onChange={handleChange}
                className="w-full px-3 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div> */}
            {/* LOA Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={12} /> LOA Date *
              </label>
              <input
                type="date"
                name="loa_date"
                value={form.loa_date}
                onChange={handleChange}
                max={form.completion_date}
                className="w-full px-3 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {/* Completion Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={12} /> Completion Date *
              </label>
              <input
                type="date"
                name="completion_date"
                min={form.loa_date}
                value={form.completion_date}
                onChange={handleChange}
                className="w-full px-3 h-11 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div>
            {parseFloat(form.workorder_Amount) > 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 mt-2 relative">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl  overflow-x-auto">
                  <div className="min-w-[280px]">
                    {/* Main Grid - Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                      {/* Workorder Amount Card */}
                      <div className=" rounded-lg p-2">
                        <p className="text-[10px] text-gray-500 truncate">
                          Workorder Amount
                        </p>
                        <p className="text-sm font-semibold text-gray-800 break-words">
                          ₹{" "}
                          {parseFloat(form.workorder_Amount).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}{" "}
                          Lakhs
                        </p>
                      </div>

                      {/* GST Amount Card */}
                      <div className=" rounded-lg p-2">
                        <p className="text-[10px] text-gray-500 truncate">
                          GST ({form.igst_percentage}%)
                        </p>
                        <p className="text-sm font-semibold text-blue-600 break-words">
                          ₹{" "}
                          {calculatedGST.igst.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          Lakhs
                        </p>
                      </div>

                      {/* Total with GST Card */}
                      <div className=" rounded-lg p-2 sm:col-span-2 lg:col-span-1">
                        <p className="text-[10px] text-gray-500 truncate">
                          Total with GST
                        </p>
                        <p className="text-sm font-bold text-green-600 break-words">
                          ₹{" "}
                          {calculatedGST.totalWithGST.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          Lakhs
                        </p>
                      </div>
                    </div>

                    {/* Total GST Amount Row */}
                    <div className="pt-2 border-t border-blue-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs">
                        <span className="text-gray-500">Total GST Amount:</span>
                        <span className="font-semibold text-purple-600 break-words">
                          ₹{" "}
                          {calculatedGST.total.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          Lakhs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Mobile Navigation */}
          {isMobile && (
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-600 text-white px-6 py-2.5 rounded-xl hover:bg-gray-700 flex items-center gap-2 text-sm"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                Next: Activities
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </motion.div>
        {/* Step 3: Activities - FULL ORIGINAL CODE PRESERVED */}
        <motion.div
          initial={false}
          animate={{
            display: !isMobile || currentStep === 3 ? "block" : "none",
            opacity: !isMobile || currentStep === 3 ? 1 : 0,
          }}
          className="bg-white rounded-xl md:rounded-3xl shadow-lg md:shadow-2xl p-4 md:p-8 border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle size={20} className="text-blue-600" />
              <span>Select Project Activities</span>
              <span className="text-xs md:text-sm font-normal text-gray-500 ">
                ({selectedActivities.length} selected)
              </span>
              <br />

              {isMobile && (
                <span className="text-xs text-gray-500 ml-auto">Step 3/3</span>
              )}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddActivityModal(true)}
              className="w-full sm:w-auto bg-blue-600 text-white px-3 md:px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={16} />
              Add New Activity
            </button>
          </div>

          {selectedActivities.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">
                  Total Weightage:
                </span>
                <span
                  className={`text-lg font-bold ${Math.abs(totalWeightage - 100) < 0.01 ? "text-green-600" : "text-red-600"}`}
                >
                  {totalWeightage}% / 100%
                </span>
              </div>
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-500">Loading activities...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              {getAllActivities().map((activity, index) => {
                const isSelected = selectedActivities.includes(activity.id);
                const isCustom = activity.isCustom;
                const uniqueKey = `activity-${index}-${activity.activity_name}`;
                return (
                  <div key={uniqueKey} className="relative group">
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        if (isSelected) {
                          // Remove activity
                          setSelectedActivities((prev) =>
                            prev.filter((id) => id !== activity.id),
                          );
                          // Doubt : need this?
                          if (expandedActivity === activity.id) {
                            setExpandedActivity(null);
                          }
                          // Clean up related state
                          setActivityWeightages((prev) => {
                            const newState = { ...prev };
                            delete newState[activity.id];
                            return newState;
                          });
                          setActivityDates((prev) => {
                            const newState = { ...prev };
                            delete newState[activity.id];
                            return newState;
                          });
                          // setSelectedSubActivities((prev) => {
                          //   const newState = { ...prev };
                          //   delete newState[activity.id];
                          //   return newState;
                          // });
                        } else {
                          // Add activity
                          setSelectedActivities((prev) => [
                            ...prev,
                            activity.id,
                          ]);
                          // Auto-select all sub-activities (using name or id)
                          // const allSubNames = activity.subActivities.map(
                          //   (sub) => sub.id,
                          // );
                          // setSelectedSubActivities((prev) => ({
                          //   ...prev,
                          //   [activity.id]: allSubNames,
                          // }));
                        }
                      }}
                      className={`cursor-pointer p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all shadow-sm
                        ${isSelected
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-lg"
                          : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300"
                        }
                      `}
                    >
                      <p className="font-medium md:font-semibold text-sm md:text-base text-center line-clamp-2">
                        {activity.activity_name}
                      </p>
                      <p
                        className={`text-xs text-center mt-1 md:mt-2 ${isSelected ? "text-blue-100" : "text-gray-400"}`}
                      >
                        {activity.subActivities.length} sub-activities
                      </p>
                      {isCustom && (
                        <span className="absolute top-1 right-1 md:top-2 md:right-2 text-[10px] md:text-xs bg-yellow-100 text-yellow-600 px-1.5 md:px-2 py-0.5 rounded-full">
                          Custom
                        </span>
                      )}
                    </motion.div>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteActivity(activity.id);
                        }}
                        className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete activity"
                      >
                        <X size={12} />
                      </button>
                    )}
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedActivityForSub(activity.id);
                          setShowAddSubActivityModal(true);
                        }}
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap"
                      >
                        <Plus size={10} />
                        Add Sub
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <AnimatePresence>
            {selectedActivities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3 md:space-y-4"
              >
                <h4 className="font-semibold text-gray-700 text-sm md:text-base flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  Configure Activities
                </h4>
                {selectedActivities
                  .map((id) => getAllActivities().find((a) => a.id === id))
                  .filter(Boolean)
                  .sort(
                    (a, b) =>
                      parseInt(a.sorting_var, 10) - parseInt(b.sorting_var, 10),
                  )
                  .map((activityData) => {
                    const activityObj = getAllActivities().find(
                      (a) => a.id === activityData?.id,
                    );
                    let activityId = activityData?.id;
                    if (!activityObj) return null;
                    const isExpanded = expandedActivity === activityId;
                    const selectedSubs =
                      selectedSubActivities[activityId] || [];

                    return (
                      <motion.div
                        key={`config-${activityId}`}
                        layout
                        className="border border-gray-200 rounded-xl md:rounded-2xl overflow-hidden bg-gray-50"
                      >
                        <div
                          onClick={() =>
                            setExpandedActivity(isExpanded ? null : activityId)
                          }
                          className="flex items-center justify-between p-3 md:p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isExpanded ? "bg-blue-600" : "bg-gray-400"}`}
                            />

                            {/* Activity Stage Edit Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingActivityStage({
                                  activityId: activityId,
                                  currentStage: activityObj.sorting_var || 0
                                });
                              }}
                              className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full"
                              title="Edit Activity Stage"
                            >
                              <Edit3 size={12} />
                              <span>Activity {activityObj.sorting_var || '?'}</span>
                            </button>

                            <h5 className="font-medium md:font-semibold text-gray-800 text-sm md:text-base truncate">
                              {/* {activityObj.sorting_var}. */}
                              {activityObj.activity_name}
                            </h5>

                            {/* {isCustom && (
                            <span className="text-[10px] md:text-xs bg-yellow-100 text-yellow-600 px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap">
                              Custom
                            </span>
                          )} */}
                            <span className="text-[10px] md:text-xs bg-blue-100 text-blue-600 px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap">
                              {selectedSubs.length}/
                              {activityObj?.subActivities.length || 0} selected
                            </span>
                          </div>

                          <div className="flex items-center gap-2 md:gap-3 ml-2">
                            {activityDates[activityId]?.startDate &&
                              activityDates[activityId]?.endDate && (
                                <div className="text-[10px] md:text-xs text-gray-500 hidden md:block">
                                  {new Date(
                                    activityDates[activityId].startDate,
                                  ).toLocaleDateString()}{" "}
                                  →{" "}
                                  {new Date(
                                    activityDates[activityId].endDate,
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            {isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </div>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-gray-200 bg-white p-3 md:p-4"
                            >
                              <div className="mb-3 md:mb-4 cursor-not-allowed">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Activity Weightage (% of total project) *
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={
                                      activityWeightages[activityId]?.toFixed(
                                        2,
                                      ) || ""
                                    }
                                    disabled
                                    className="cursor-not-allowed w-full px-3 py-1.5 md:py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
                                    placeholder="Weightage as per SubActivities"
                                  />
                                  <Percent
                                    size={14}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-gray-600">
                                    Start Date *
                                  </label>
                                  <input
                                    type="date"
                                    value={
                                      activityDates[activityId]?.startDate || ""
                                    }
                                    min={form.loa_date}
                                    max={activityDates[activityId]?.endDate || form.completion_date}
                                    onChange={(e) =>
                                      handleActivityDateChange(
                                        activityId,
                                        "startDate",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-gray-600">
                                    End Date *
                                  </label>
                                  <input
                                    type="date"
                                    value={
                                      activityDates[activityId]?.endDate || ""
                                    }
                                    min={activityDates[activityId]?.startDate || form.loa_date}
                                    max={form.completion_date}
                                    onChange={(e) =>
                                      handleActivityDateChange(
                                        activityId,
                                        "endDate",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between items-center mb-2">
                                <h6 className="font-medium text-gray-700 text-xs md:text-sm">
                                  Sub-Activities:
                                </h6>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedActivityForSub(activityId);
                                    setShowAddSubActivityModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs"
                                >
                                  <Plus size={12} />
                                  Add New Sub-Activity
                                </button>
                              </div>

                              <div className="space-y-2 md:space-y-3">
                                {activityObj?.subActivities.length > 0 && (
                                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={
                                          getSelectAllStatus(activityId)
                                            .isAllSelected
                                        }
                                        ref={(el) => {
                                          if (el) {
                                            el.indeterminate =
                                              getSelectAllStatus(
                                                activityId,
                                              ).isIndeterminate;
                                          }
                                        }}
                                        onChange={(e) =>
                                          handleSelectAllSubActivities(
                                            activityId,
                                            e.target.checked,
                                          )
                                        }
                                        className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-xs font-medium text-gray-500">
                                        {selectedSubs.length} of{" "}
                                        {activityObj.subActivities.length}{" "}
                                        selected
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      {!getSelectAllStatus(activityId)
                                        .isAllSelected ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSelectAllSubActivities(
                                              activityId,
                                              true,
                                            )
                                          }
                                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                          Select All
                                        </button>
                                      ) : (
                                        // <span className="text-gray-300">|</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSelectAllSubActivities(
                                              activityId,
                                              false,
                                            )
                                          }
                                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                          Unselect All
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {(() => {
                                  const grouped = {};

                                  activityObj?.subActivities.forEach(
                                    (sub, idx) => {
                                      if (!grouped[sub.subactivity_name]) {
                                        grouped[sub.subactivity_name] = [];
                                      }
                                      grouped[sub.subactivity_name].push({
                                        ...sub,
                                        originalIndex: idx,
                                      });
                                    },
                                  );

                                  const allRendered = [];


                                  Object.keys(grouped).forEach((name) => {
                                    const items = grouped[name];

                                    items.forEach((sub, serialIndex) => {
                                      const displayName =
                                        items.length > 1
                                          ? `${sub.subactivity_name}`
                                          : sub.subactivity_name;
                                      const isSelected = selectedSubs.includes(
                                        sub.id,
                                      );
                                      const key = `${activityId}_${sub.id}`;
                                      // const key = `${activityId}_${sub.subactivity_name}`;
                                      // const key2 = `${sub?.id}_${sub.subactivity_name}`;
                                      const currentUnit =
                                        subActivityUnits[key] || sub.unit;
                                      // const subUniqueKey = `sub-${serialIndex}-${sub.originalIndex}-${sub.subactivity_name}`;
                                      const subUniqueKey = `sub-${serialIndex}-${sub.originalIndex}-${sub.id}`;

                                      allRendered.push(
                                        <div
                                          key={subUniqueKey}
                                          id={`sub-${sub.id}`}
                                          className="bg-gray-50 p-2 md:p-3 rounded-lg border border-gray-200"
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            {/* <div className="flex items-center gap-2">
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) =>
                                                  handleSubActivitySelection(
                                                    activityId,
                                                    sub.id,
                                                    e.target.checked,
                                                  )
                                                }
                                                className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rounded focus:ring-blue-500"
                                              />
                                              <span
                                                className="text-xs md:text-sm font-medium text-gray-700 cursor-pointer"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleSubActivitySelection(
                                                    activityId,
                                                    sub.id,
                                                    !isSelected,
                                                  );
                                                }}
                                              >
                                                Stage {sub.sorting_var}: {displayName}
                                              </span>


                                              {sub.isCustom && (
                                                <span className="text-[9px] bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded-full">
                                                  Custom
                                                </span>
                                              )}
                                            </div> */}
                                            <div className="flex items-center gap-2 flex-1">
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) =>
                                                  handleSubActivitySelection(
                                                    activityId,
                                                    sub.id,
                                                    e.target.checked,
                                                  )
                                                }
                                                className="w-3 h-3 md:w-4 md:h-4 text-blue-600 rounded focus:ring-blue-500"
                                              />
                                              <div className="flex items-center gap-2 flex-wrap">
                                                {/* Stage Edit Button */}
                                                {isSelected && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingStage({
                                                        activityId: activityId,
                                                        subId: sub.id,
                                                        currentStage: sub.sorting_var || 0
                                                      });
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full"
                                                    title="Edit Stage"
                                                  >
                                                    <Edit3 size={12} />
                                                    <span>Stage {sub.sorting_var || '?'}</span>
                                                  </button>
                                                )}

                                                <span
                                                  className="text-xs md:text-sm font-medium text-gray-700 cursor-pointer"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSubActivitySelection(
                                                      activityId,
                                                      sub.id,
                                                      !isSelected,
                                                    );
                                                  }}
                                                >
                                                  {/* {sub.sorting_var}. {displayName} */}
                                                  {displayName}
                                                </span>

                                              </div>
                                              {sub.isCustom && (
                                                <span className="text-[9px] bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded-full">
                                                  Custom
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-1">
                                              {/* Clone Button */}
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleCloneSubActivity(
                                                    activityId,
                                                    sub.id,
                                                  )
                                                }
                                                className="text-blue-500 hover:text-blue-700"
                                                title="Add Similar Sub-Activity"
                                              >
                                                <Copy size={14} />
                                              </button>

                                              {/* Edit Button */}
                                              {/* <button
                                                type="button"
                                                onClick={() => handleEditSubActivity(activityId, sub.id)}
                                                className="text-blue-500 hover:text-blue-700"
                                                title="Edit sub-activity"
                                              >
                                                <Edit3 size={14} />
                                              </button> */}

                                              {/* Doubt : need this? */}
                                              {/* Edit Button */}
                                              {(sub.isCustom ||
                                                activityObj.isCustom) && (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleDeleteSubActivity(
                                                        activityId,
                                                        sub.id,
                                                      )
                                                    }
                                                    className="text-red-500 hover:text-red-700"
                                                  >
                                                    <X size={14} />
                                                  </button>
                                                )}
                                            </div>
                                          </div>
                                          {isSelected && (
                                            <div>
                                              <div className="grid grid-cols-3 gap-2 mt-2 pl-5">
                                                <div>
                                                  <label className="block text-[10px] text-gray-500 mb-1">
                                                    Unit *
                                                  </label>
                                                  <select
                                                    value={currentUnit}
                                                    onChange={(e) =>
                                                      handleSubActivityUnitChange(
                                                        activityId,
                                                        sub.id,
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                                  >
                                                    {UNIT_OPTIONS.map(
                                                      (option) => (
                                                        <option
                                                          key={option.value}
                                                          value={option.value}
                                                        >
                                                          {option.label}
                                                        </option>
                                                      ),
                                                    )}
                                                  </select>
                                                </div>
                                                {currentUnit !== "status" && sub?.planned_quantity_exist && (
                                                  <div>
                                                    <label className="block text-[10px] text-gray-500 mb-1">
                                                      Planned Quantity
                                                    </label>
                                                    <input
                                                      type="number"
                                                      min="0"
                                                      step="0.01"
                                                      // value={subActivityPlannedQtys[key2] || ''}
                                                      value={
                                                        subActivityPlannedQtys[
                                                        `${sub.id}_quantity`
                                                        ] || ""
                                                      }
                                                      // onChange={(e) => handleSubActivityPlannedQtyChange(sub?.id, sub.subactivity_name, e.target.value)}
                                                      onChange={(e) =>
                                                        handleSubActivityPlannedQtyChange(
                                                          sub.id,
                                                          "quantity",
                                                          e.target.value,
                                                        )
                                                      }
                                                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                                      placeholder="Enter qty"
                                                    />
                                                  </div>
                                                )}

                                                {sub?.chainage_exist && <div>
                                                  <div className="grid grid-cols-1 gap-1 col-span-3">
                                                    <div>
                                                      <div className="flex flex-row justify-between items-center">
                                                        <label className="block text-[10px] text-gray-500 mb-1">
                                                          Chainage Start
                                                        </label>
                                                        {currentUnit ===
                                                          "status" && (
                                                            // <div className="col-span-3">
                                                            //   <div className="text-[10px] text-blue-600 bg-blue-50 p-1 rounded flex items-center gap-1">
                                                            //     <Info size={10} />
                                                            //     Status-based - no quantity needed
                                                            //   </div>
                                                            // </div>
                                                            <div className="text-[10px] text-blue-600 bg-blue-50 rounded flex items-center gap-1">
                                                              <Info size={10} />
                                                              Status-based - no
                                                              quantity needed
                                                            </div>
                                                          )}
                                                      </div>
                                                      {/* <input
                                                      type="number"
                                                      min="0"
                                                      step="0.01"
                                                      // value={subActivityPlannedQtys[(key2 + "_chainagestart")] || ''}
                                                      value={subActivityPlannedQtys[`${sub.id}_chainagestart`] || ''}
                                                      // onChange={(e) => handleSubActivityPlannedQtyChange(sub?.id, (sub.subactivity_name + "_chainagestart"), e.target.value)}
                                                      onChange={(e) => handleSubActivityPlannedQtyChange(sub.id, 'chainagestart', e.target.value)}
                                                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                                      placeholder="001"
                                                    /> */}
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        defaultValue={
                                                          sub.chainage_start ||
                                                          ""
                                                        } // Read from sub object directly
                                                        // disabled // Make it read-only as it's calculated
                                                        onChange={(e) => handleSubActivityPlannedQtyChange(sub.id, 'chainagestart', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-gray-100"
                                                        placeholder="001"
                                                      />
                                                    </div>
                                                  </div>
                                                </div>}

                                                {sub?.length_exist &&
                                                  <div>
                                                    <div className="grid grid-cols-1 gap-1 col-span-3">
                                                      <div>
                                                        <div className="flex flex-row justify-between items-center">
                                                          <label className="block text-[10px] text-gray-500 mb-1">
                                                            Chainage Length
                                                          </label>
                                                          {currentUnit ===
                                                            "status" && (
                                                              <div className="text-[10px] text-blue-600 bg-blue-50 rounded flex items-center gap-1">
                                                                <Info size={10} />
                                                                Status-based - no
                                                                quantity needed
                                                              </div>
                                                            )}
                                                        </div>
                                                        {/* <input
                                                      type="number"
                                                      min="0"
                                                      step="0.01"
                                                      value={subActivityPlannedQtys[`${sub.id}_coveredarea`] || ''}
                                                      onChange={(e) => handleSubActivityPlannedQtyChange(sub.id, 'coveredarea', e.target.value)}
                                                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                                      placeholder="001"
                                                    /> */}
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          step="0.01"
                                                          value={
                                                            sub.covered_area || ""
                                                          } // Read from sub object directly
                                                          onChange={(e) => {
                                                            // Update the sub-activity's covered_area in the state
                                                            const newValue =
                                                              e.target.value;
                                                            const templateIndex =
                                                              templatesActivities.findIndex(
                                                                (act) =>
                                                                  act.id ===
                                                                  activityId,
                                                              );
                                                            if (
                                                              templateIndex !== -1
                                                            ) {
                                                              setTemplateActivities(
                                                                (prev) =>
                                                                  prev.map(
                                                                    (act) => {
                                                                      if (
                                                                        act.id ===
                                                                        activityId
                                                                      ) {
                                                                        return {
                                                                          ...act,
                                                                          subActivities:
                                                                            act.subActivities.map(
                                                                              (
                                                                                s,
                                                                              ) =>
                                                                                s.id ===
                                                                                  sub.id
                                                                                  ? {
                                                                                    ...s,
                                                                                    covered_area:
                                                                                      newValue,
                                                                                  }
                                                                                  : s,
                                                                            ),
                                                                        };
                                                                      }
                                                                      return act;
                                                                    },
                                                                  ),
                                                              );
                                                            } else {
                                                              setCustomActivities(
                                                                (prev) =>
                                                                  prev.map(
                                                                    (act) => {
                                                                      if (
                                                                        act.id ===
                                                                        activityId
                                                                      ) {
                                                                        return {
                                                                          ...act,
                                                                          subActivities:
                                                                            act.subActivities.map(
                                                                              (
                                                                                s,
                                                                              ) =>
                                                                                s.id ===
                                                                                  sub.id
                                                                                  ? {
                                                                                    ...s,
                                                                                    covered_area:
                                                                                      newValue,
                                                                                  }
                                                                                  : s,
                                                                            ),
                                                                        };
                                                                      }
                                                                      return act;
                                                                    },
                                                                  ),
                                                              );
                                                            }
                                                          }}
                                                          className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                                          placeholder="Length"
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>}
                                                {sub?.submission_exist &&
                                                  <div>
                                                    <label className="block text-[10px] text-gray-500 mb-1">
                                                      Submission Payment (%)
                                                    </label>
                                                    <div className="relative">
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        // value={subActivityPlannedQtys[(key2 + "_subpayment")] || ''}
                                                        value={
                                                          subActivityPlannedQtys[
                                                          `${sub.id}_subpayment`
                                                          ] || ""
                                                        }
                                                        // onChange={(e) => handleSubActivityPlannedQtyChange(sub?.id, (sub.subactivity_name + "_subpayment"), e.target.value)}
                                                        onChange={(e) =>
                                                          handleSubActivityPlannedQtyChange(
                                                            sub.id,
                                                            "subpayment",
                                                            e.target.value,
                                                          )
                                                        }
                                                        onBlur={(e) =>
                                                          handleActivityWeightageChange(
                                                            activityId,
                                                            getActivityTotals(
                                                              activityData,
                                                              subActivityPlannedQtys,
                                                            ),
                                                            sub.id
                                                          )
                                                        }
                                                        className="w-full pr-7 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Enter payment in %"
                                                      />
                                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                                        <Percent
                                                          className=" text-gray-400"
                                                          size={16}
                                                        />
                                                      </span>
                                                    </div>
                                                  </div>}

                                                {sub?.approval_exist &&
                                                  <div>
                                                    <label className="block text-[10px] text-gray-500 mb-1">
                                                      Approval Payment (%)
                                                    </label>
                                                    <div className="relative">
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        // value={subActivityPlannedQtys[(key2 + "_approvalpayment")] || ''}
                                                        value={
                                                          subActivityPlannedQtys[
                                                          `${sub.id}_approvalpayment`
                                                          ] || ""
                                                        }
                                                        // onChange={(e) => handleSubActivityPlannedQtyChange(sub?.id, (sub.subactivity_name + "_approvalpayment"), e.target.value)}
                                                        onChange={(e) =>
                                                          handleSubActivityPlannedQtyChange(
                                                            sub.id,
                                                            "approvalpayment",
                                                            e.target.value,
                                                          )
                                                        }
                                                        onBlur={(e) =>
                                                          handleActivityWeightageChange(
                                                            activityId,
                                                            getActivityTotals(
                                                              activityData,
                                                              subActivityPlannedQtys,
                                                            ),
                                                            sub.id
                                                          )
                                                        }
                                                        className="w-full pr-7 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Enter payment in %"
                                                      />
                                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                                        <Percent
                                                          className=" text-gray-400"
                                                          size={16}
                                                        />
                                                      </span>
                                                    </div>
                                                  </div>}

                                                <div className="col-span-3 mt-2">
                                                  {(parseFloat(
                                                    subActivityPlannedQtys[
                                                    `${sub.id}_subpayment`
                                                    ],
                                                  ) > 0 ||
                                                    parseFloat(
                                                      subActivityPlannedQtys[
                                                      `${sub.id}_approvalpayment`
                                                      ],
                                                    ) > 0) && (
                                                      <div className="col-span-1 sm:col-span-2 lg:col-span-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl overflow-x-auto">
                                                        <div className="min-w-[280px]">
                                                          {/* Payment Cards Grid */}
                                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {/* Submission Payment Card */}
                                                            {parseFloat(
                                                              subActivityPlannedQtys[
                                                              `${sub.id}_subpayment`
                                                              ],
                                                            ) > 0 && (
                                                                <div
                                                                  key={`${sub.id}-submission`}
                                                                  className="rounded-lg"
                                                                >
                                                                  <p className="text-[10px] text-gray-500 truncate">
                                                                    Submission (
                                                                    {
                                                                      subActivityPlannedQtys[
                                                                      `${sub.id}_subpayment`
                                                                      ]
                                                                    }
                                                                    %)
                                                                  </p>
                                                                  <p className="text-sm font-semibold text-blue-600 break-words">
                                                                    ₹{" "}
                                                                    {(
                                                                      (parseFloat(
                                                                        form.workorder_Amount,
                                                                      ) *
                                                                        parseFloat(
                                                                          subActivityPlannedQtys[
                                                                          `${sub.id}_subpayment`
                                                                          ],
                                                                        )) /
                                                                      100
                                                                    ).toLocaleString(
                                                                      "en-IN",
                                                                      {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                      },
                                                                    )}{" "}
                                                                    Lakhs
                                                                  </p>
                                                                </div>
                                                              )}

                                                            {/* Approval Payment Card */}
                                                            {parseFloat(
                                                              subActivityPlannedQtys[
                                                              `${sub.id}_approvalpayment`
                                                              ],
                                                            ) > 0 && (
                                                                <div
                                                                  key={`${sub.id}-approval`}
                                                                  className="rounded-lg"
                                                                >
                                                                  <p className="text-[10px] text-gray-500 truncate">
                                                                    Approval (
                                                                    {
                                                                      subActivityPlannedQtys[
                                                                      `${sub.id}_approvalpayment`
                                                                      ]
                                                                    }
                                                                    %)
                                                                  </p>
                                                                  <p className="text-sm font-semibold text-blue-600 break-words">
                                                                    ₹{" "}
                                                                    {(
                                                                      (parseFloat(
                                                                        form.workorder_Amount,
                                                                      ) *
                                                                        parseFloat(
                                                                          subActivityPlannedQtys[
                                                                          `${sub.id}_approvalpayment`
                                                                          ],
                                                                        )) /
                                                                      100
                                                                    ).toLocaleString(
                                                                      "en-IN",
                                                                      {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                      },
                                                                    )}{" "}
                                                                    Lakhs
                                                                  </p>
                                                                </div>
                                                              )}

                                                            {/* Total Amount Card */}
                                                            <div
                                                              key={`${sub.id}-total`}
                                                              className="rounded-lg"
                                                            >
                                                              <p className="text-[10px] text-gray-500">
                                                                Total Amount
                                                              </p>
                                                              <p className="text-sm font-bold text-green-600 break-words">
                                                                ₹{" "}
                                                                {(
                                                                  (parseFloat(
                                                                    subActivityPlannedQtys[
                                                                    `${sub.id}_subpayment`
                                                                    ],
                                                                  ) > 0
                                                                    ? (parseFloat(
                                                                      form.workorder_Amount,
                                                                    ) *
                                                                      parseFloat(
                                                                        subActivityPlannedQtys[
                                                                        `${sub.id}_subpayment`
                                                                        ],
                                                                      )) /
                                                                    100
                                                                    : 0) +
                                                                  (parseFloat(
                                                                    subActivityPlannedQtys[
                                                                    `${sub.id}_approvalpayment`
                                                                    ],
                                                                  ) > 0
                                                                    ? (parseFloat(
                                                                      form.workorder_Amount,
                                                                    ) *
                                                                      parseFloat(
                                                                        subActivityPlannedQtys[
                                                                        `${sub.id}_approvalpayment`
                                                                        ],
                                                                      )) /
                                                                    100
                                                                    : 0)
                                                                ).toLocaleString(
                                                                  "en-IN",
                                                                  {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                  },
                                                                )}{" "}
                                                                Lakhs
                                                              </p>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                </div>
                                              </div>
                                              <div className="ml-4">
                                                <label className="block text-[10px] text-gray-500 mb-1">
                                                  Description
                                                </label>
                                                <textarea
                                                  // value={subActivityPlannedQtys[key2 + "_description"] || ''}
                                                  value={
                                                    subActivityPlannedQtys[
                                                    `${sub.id}_description`
                                                    ] || ""
                                                  }
                                                  // onChange={(e) => handleSubActivityPlannedQtyChange(sub?.id, (sub.subactivity_name + "_description"), e.target.value)}
                                                  onChange={(e) =>
                                                    handleSubActivityPlannedQtyChange(
                                                      sub.id,
                                                      "description",
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 mt-2"
                                                  placeholder="Enter any specific details or instructions for this sub-activity"
                                                  rows={2}
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>,
                                      );
                                    });
                                  });

                                  return allRendered;
                                })()}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
              </motion.div>
            )}
          </AnimatePresence>
          {selectedActivities.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 md:py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl md:rounded-2xl"
            >
              <CheckCircle
                size={32}
                className="mx-auto mb-2 opacity-30 text-red-600"
              />
              {/* <p className="text-xs md:text-sm">No Activities Selected</p> */}
              <div className="text-xs ml-auto text-red-600">
                One Activity must be selected to proceed.
              </div>
            </motion.div>
          )}
          {isMobile && (
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-600 text-white px-6 py-2.5 rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg transition-all text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Project
                    <CheckCircle size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
        {!isMobile && (
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 md:px-16 py-4 md:py-5 rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 font-bold text-base md:text-xl flex items-center gap-2 md:gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating Project...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Create Project
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </motion.div>
  );
};
export default CreateProject;
