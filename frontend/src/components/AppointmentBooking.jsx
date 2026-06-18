import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const AppointmentBooking = () => {
    // const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const data = await apiService.getDoctors();
                setDoctors(data);
            } catch (error) {
                console.error('Failed to fetch doctors:', error);
            } finally {
                setLoadingDoctors(false);
            }
        };

        fetchDoctors();
    }, []);

    return (
        <div>
            <h1>Book Appointment</h1>
            {loadingDoctors ? <p>Loading doctors...</p> : <p>Loaded {doctors.length} doctors</p>}
        </div>
    );
};

export default AppointmentBooking;