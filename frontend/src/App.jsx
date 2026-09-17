
import { useState, useEffect } from 'react';

import './App.css';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { HomePage } from './pages/HomePage';
import { HospitalResultsPage } from './pages/HospitalResultsPage';
import { HealthProblemPage } from './pages/HealthProblemPage';
import { HospitalDetailsPage } from './pages/HospitalDetailsPage';
import { OnlineConsultationPage } from './pages/OnlineConsultationPage';
import { DoctorDetailsPage } from './pages/DoctorDetailsPage';
import { AppointmentBookingPage } from './pages/AppointmentBookingPage';
import { CustomerHelpPage } from './pages/CustomerHelpPage';

import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OTPPage } from './pages/OTPPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { LogoutPage } from './pages/LogoutPage';

import  PatientStayPage  from './pages/PatientStayPage';

import { AuthProvider, useAuth } from './context/AuthContext';

const AUTH_STORAGE_KEY = 'meditrust_user';

function parseHash(hash) {
  const clean = hash.replace(/^#\/?/, '');

  if (!clean || clean === 'home') {
    return { page: 'home', params: {} };
  }

  if (clean === 'results') {
    return { page: 'results', params: {} };
  }

  if (clean === 'health-problem') {
    return { page: 'health-problem', params: {} };
  }

  if (clean.startsWith('hospital/')) {
    const id = clean.replace('hospital/', '');

    return {
      page: 'hospital-details',
      params: { hospitalId: id },
    };
  }

  if (clean === 'consultation') {
    return { page: 'consultation', params: {} };
  }

  if (clean.startsWith('doctor/')) {
    const id = clean.replace('doctor/', '');

    return {
      page: 'doctor-details',
      params: { doctorId: id },
    };
  }

  if (clean === 'book-appointment') {
    return { page: 'book-appointment', params: {} };
  }

  if (clean === 'help') {
    return { page: 'help', params: {} };
  }

  if (clean === 'login') {
    return { page: 'login', params: {} };
  }

  if (clean === 'forgot-password') {
    return { page: 'forgot-password', params: {} };
  }

  if (clean === 'otp') {
    return { page: 'otp', params: {} };
  }

  if (clean === 'reset-password') {
    return { page: 'reset-password', params: {} };
  }

  if (clean === 'logout') {
    return { page: 'logout', params: {} };
  }

  if (clean === 'stays') {
    return { page: 'stays', params: {} };
  }

  if (clean.startsWith('stays/')) {
    return {
      page: 'stays',
      params: {
        hospitalId: clean.replace('stays/', ''),
      },
    };
  }

  return { page: 'home', params: {} };
}

function AppContent() {
  const [route, setRoute] = useState(() =>
    parseHash(window.location.hash)
  );

  const [bookingData, setBookingData] = useState({});

  const [resultsState, setResultsState] = useState({
    query: '',
    location: 'Near me',
    selectedId: null,
  });

  const { user, logout } = useAuth();

  const userName = user?.full_name || null;

  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = parseHash(window.location.hash);

      setRoute(newRoute);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };

    window.addEventListener(
      'hashchange',
      handleHashChange
    );

    return () => {
      window.removeEventListener(
        'hashchange',
        handleHashChange
      );
    };
  }, []);

  const navigate = (page, params = {}) => {
    let hashTarget = `#${page}`;

    if (
      page === 'hospital-details' &&
      params.hospitalId
    ) {
      hashTarget = `#hospital/${params.hospitalId}`;
    }

    else if (
      page === 'doctor-details' &&
      params.doctorId
    ) {
      hashTarget = `#doctor/${params.doctorId}`;
    }

    else if (
      page === 'stays' &&
      params.hospitalId
    ) {
      hashTarget = `#stays/${params.hospitalId}`;
    }

    else if (page === 'results') {
      hashTarget = '#results';

      if (
        params.query !== undefined ||
        params.location !== undefined ||
        params.selectedId !== undefined
      ) {
        setResultsState((prev) => ({
          ...prev,

          query:
            params.query !== undefined
              ? params.query
              : prev.query,

          location:
            params.location || prev.location,

          selectedId:
            params.selectedId !== undefined
              ? params.selectedId
              : prev.selectedId,
        }));
      }
    }

    if (window.location.hash === hashTarget) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      window.location.hash = hashTarget;
    }
  };

  const handleSelectHospital = (hospitalId) => {
    navigate('hospital-details', {
      hospitalId,
    });
  };

  const handleSearchHospitals = (
    query,
    location
  ) => {
    navigate('results', {
      query,
      location,
    });
  };

  const handleBookHospitalVisit = (
    hospitalName,
    specialty,
    hospitalId = ''
  ) => {
    setBookingData({
      hospital: hospitalName,
      hospitalId,
      specialty,
      consultationType:
        'In-Clinic Hospital Visit',
      date: new Date()
        .toISOString()
        .split('T')[0],
      time: '10:30 AM',
    });

    navigate('book-appointment');
  };

  const handleSelectDoctor = (doctorId) => {
    navigate('doctor-details', {
      doctorId,
    });
  };

  const handleProceedToDoctorBooking = (
    doctorBookingInfo
  ) => {
    setBookingData(doctorBookingInfo);

    navigate('book-appointment');
  };

  return (
    <div className="app-container">

      <Navbar
        activePage={route.page}
        onNavigate={(page) =>
          navigate(page)
        }
        userName={userName}
        onLogoutClick={() =>
          navigate('logout')
        }
      />

      <main className="main-content-flow">

        {route.page === 'home' && (
          <HomePage
            onNavigate={navigate}
            onSelectHospital={
              handleSelectHospital
            }
            onSearchHospitals={
              handleSearchHospitals
            }
          />
        )}

        {route.page === 'results' && (
          <HospitalResultsPage
            initialQuery={
              resultsState.query
            }
            initialLocation={
              resultsState.location
            }
            initialSelectedId={
              resultsState.selectedId
            }
            onNavigate={navigate}
            onSelectHospital={
              handleSelectHospital
            }
          />
        )}

        {route.page === 'health-problem' && (
          <HealthProblemPage
            onNavigate={navigate}
            onSelectHospital={
              handleSelectHospital
            }
          />
        )}

        {route.page === 'hospital-details' && (
          <HospitalDetailsPage
            hospitalId={
              route.params.hospitalId
            }
            onNavigate={navigate}
            onBookHospitalVisit={
              handleBookHospitalVisit
            }
          />
        )}

        {route.page === 'consultation' && (
          <OnlineConsultationPage
            onNavigate={navigate}
            onSelectDoctor={
              handleSelectDoctor
            }
          />
        )}

        {route.page === 'doctor-details' && (
          <DoctorDetailsPage
            doctorId={
              route.params.doctorId
            }
            onNavigate={navigate}
            onProceedToBooking={
              handleProceedToDoctorBooking
            }
          />
        )}

        {route.page === 'book-appointment' && (
          <AppointmentBookingPage
            prefilledData={bookingData}
            onNavigate={navigate}
          />
        )}

        {route.page === 'help' && (
          <CustomerHelpPage
            onNavigate={navigate}
          />
        )}

        {route.page === 'stays' && (
          <PatientStayPage
            hospitalId={
              route.params.hospitalId
            }
            onNavigate={navigate}
          />
        )}

        {route.page === 'login' && (
          <LoginPage
            onNavigate={navigate}
            onLogin={() =>
              navigate('home')
            }
          />
        )}

        {route.page === 'forgot-password' && (
          <ForgotPasswordPage
            onNavigate={navigate}
          />
        )}

        {route.page === 'otp' && (
          <OTPPage
            onNavigate={navigate}
          />
        )}

        {route.page === 'reset-password' && (
          <ResetPasswordPage
            onNavigate={navigate}
          />
        )}

        {route.page === 'logout' && (
          <LogoutPage
            onNavigate={navigate}
            onLogout={logout}
            userName={userName}
          />
        )}

      </main>

      <Footer
        onNavigate={(page) =>
          navigate(page)
        }
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

