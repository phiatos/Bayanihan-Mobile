import { Alert } from 'react-native';
import RDANAStyles from '../styles/RDANAStyles';

// Format date to YYYY-MM-DD
export const formatDate = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date)) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format time to 12-hour format (e.g., 01:30 PM)
export const formatTime = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date)) return '';
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

// Parse time string to Date object
export const parseTimeToDate = (timeString) => {
  if (!timeString || !/^\d{2}:\d{2}\s?(AM|PM)?$/.test(timeString)) return new Date();
  const [time, period] = timeString.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period) {
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Validate date string
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date) && dateString === formatDate(date);
};

// Capitalize first letter
export const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Handle input change
export const handleChange = (field, value, setReportData, setErrors) => {
  setReportData((prev) => ({ ...prev, [field]: value }));
  setErrors((prev) => {
    const newErrors = { ...prev };
    if (value && newErrors[field]) {
      delete newErrors[field];
    }
    return newErrors;
  });
};

// Handle date change
export const handleDateChange = (field, event, date, setShowDatePicker, setTempDate, setReportData, setErrors) => {
  if (event.type === 'dismissed') {
    setShowDatePicker((prev) => ({ ...prev, [field]: false }));
    return;
  }
  if (date) {
    setTempDate((prev) => ({ ...prev, [field]: date }));
    setReportData((prev) => ({ ...prev, [field]: formatDate(date) }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }
  setShowDatePicker((prev) => ({ ...prev, [field]: false }));
};

// Handle time change
export const handleTimeChange = (field, event, time, setShowTimePicker, setTempDate, setReportData, setErrors) => {
  if (event.type === 'dismissed') {
    setShowTimePicker((prev) => ({ ...prev, [field]: false }));
    return;
  }
  if (time) {
    setTempDate((prev) => ({ ...prev, [field]: time }));
    setReportData((prev) => ({ ...prev, [field]: formatTime(time) }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }
  setShowTimePicker((prev) => ({ ...prev, [field]: false }));
};

// Handle checklist selection
export const handleNeedsSelect = (field, setChecklist, setReportData) => {
  setChecklist((prev) => {
    const newChecklist = { ...prev, [field]: !prev[field] };
    setReportData((prevData) => ({
      ...prevData,
      [field]: newChecklist[field] ? 'Yes' : 'No',
    }));
    return newChecklist;
  });
};

// Handle delete action
export const handleDelete = (index, setDeleteIndex, setDeleteModalVisible) => {
  setDeleteIndex(index);
  setDeleteModalVisible(true);
};

// Confirm delete
export const confirmDelete = (setAffectedMunicipalities, setDeleteModalVisible, setDeleteIndex, deleteIndex) => {
  setAffectedMunicipalities((prev) => prev.filter((_, i) => i !== deleteIndex));
  setDeleteModalVisible(false);
  setDeleteIndex(null);
};

// Cancel delete
export const cancelDelete = (setDeleteModalVisible, setDeleteIndex) => {
  setDeleteModalVisible(false);
  setDeleteIndex(null);
};

// Filter location data
export const filterLocationData = (level, query, parentValue, regions, provinces, cities, barangays) => {
  const normalize = (str) => (str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '');
  const queryNormalized = normalize(query);

  if (level === 'region') {
    return regions.filter((item) => normalize(item.region_name).includes(queryNormalized)).slice(0, 20);
  } else if (level === 'province') {
    if (!parentValue) return [];
    const region = regions.find((r) => normalize(r.region_name) === normalize(parentValue));
    if (!region) return [];
    return provinces
      .filter((item) => item.region_code === region.region_code && normalize(item.province_name).includes(queryNormalized))
      .slice(0, 20);
  } else if (level === 'city') {
    if (!parentValue) return [];
    const province = provinces.find((p) => normalize(p.province_name) === normalize(parentValue));
    if (!province) return [];
    return cities
      .filter((item) => item.province_code === province.province_code && normalize(item.city_name).includes(queryNormalized))
      .slice(0, 20);
  } else if (level === 'barangay') {
    if (!parentValue) return [];
    const city = cities.find((c) => normalize(c.city_name) === normalize(parentValue));
    if (!city) return [];
    return barangays
      .filter((item) => item.city_code === city.city_code && normalize(item.brgy_name).includes(queryNormalized))
      .slice(0, 20);
  }
  return [];
};

// Validate municipality inputs
export const validateMunicipalityInputs = (reportData) => {
  const requiredFields = [
    'community',
    'totalPop',
    'affected',
    'deaths',
    'injured',
    'missing',
    'children',
    'women',
    'seniors',
    'pwd',
  ];
  const errors = {};
  let isValid = true;

  requiredFields.forEach((field) => {
    if (!reportData[field] || reportData[field].trim() === '') {
      errors[field] = `Please enter the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Render label with optional required indicator
export const renderLabel = (label, isRequired) => (
  <Text style={isRequired ? RDANAStyles.requiredLabel : RDANAStyles.label}>
    {label}
    {isRequired && <Text style={RDANAStyles.requiredIndicator}> *</Text>}
  </Text>
);