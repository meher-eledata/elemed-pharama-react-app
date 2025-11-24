import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { RootState } from '../redux/store';
import { getTimeUntilExpiry, isTokenExpired } from '../utils/tokenUtils';
import { useNavigate } from 'react-router-dom';

export const useTokenExpiration = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    if (isTokenExpired(token)) {
      dispatch(logout());
      navigate('/');
      return;
    }

    const timeUntilExpiry = getTimeUntilExpiry(token);
    
    if (timeUntilExpiry <= 0) {
      dispatch(logout());
      navigate('/');
      return;
    }

    const timeoutId = setTimeout(() => {
      dispatch(logout());
      navigate('/');
      
      alert('Your session has expired. Please log in again.');
    }, timeUntilExpiry);

    return () => clearTimeout(timeoutId);
  }, [token, isAuthenticated, dispatch, navigate]);
};

