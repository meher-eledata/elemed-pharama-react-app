import { useEffect, useRef } from 'react';
import { useGetDoctorPhonesAndEmailsMutation, DoctorPhoneEmailInfo } from '../../../redux/slices/salesApi';

interface UseDoctorPhonesAndEmailsParams {
  doctorName: string;
  doctorMobile: string;
  doctorEmail: string;
  doctorNames: string[];
  onInfoFetched: (info: DoctorPhoneEmailInfo[]) => void;
  onDoctorAutoFill: (phone: string, email: string) => void;
  onInfoClear: () => void;
}

export const useDoctorPhonesAndEmails = ({
  doctorName,
  doctorMobile,
  doctorEmail,
  doctorNames,
  onInfoFetched,
  onDoctorAutoFill,
  onInfoClear,
}: UseDoctorPhonesAndEmailsParams) => {
  const [getDoctorPhonesAndEmails] = useGetDoctorPhonesAndEmailsMutation();
  const shouldFetchImmediatelyRef = useRef(false);

  useEffect(() => {
    const fetchPhonesAndEmailsForDoctor = async () => {
      if (doctorName && doctorName.trim()) {
        try {
          const result = await getDoctorPhonesAndEmails({ name: doctorName.trim() }).unwrap();
          const info = result.info || [];
          onInfoFetched(info);
          
          const normalizedDoctorName = doctorName.trim().toLowerCase();
          const isExactMatch = doctorNames.length > 0 && doctorNames.some(name => name.toLowerCase() === normalizedDoctorName);
          
          if (info.length === 1) {
            const singleInfo = info[0];
            
            // Auto-fill if exact match or fields are empty
            if (isExactMatch || (!doctorMobile && !doctorEmail)) {
              onDoctorAutoFill(singleInfo.phone, singleInfo.email);
            }
          } else if (info.length === 0) {
            // Clear if no info found and it was an exact match
            if (isExactMatch && (doctorMobile || doctorEmail)) {
              onInfoClear();
            }
          }
        } catch (error) {
          console.error('❌ Error fetching doctor phones and emails:', error);
          onInfoFetched([]);
        }
      } else {
        onInfoFetched([]);
      }
    };

    const normalizedDoctorName = doctorName.trim().toLowerCase();
    const isExactMatch = doctorNames.length > 0 && doctorNames.some(name => name.toLowerCase() === normalizedDoctorName);
    const shouldFetchImmediately = shouldFetchImmediatelyRef.current || isExactMatch;

    shouldFetchImmediatelyRef.current = false;

    if (shouldFetchImmediately && doctorName && doctorName.trim()) {
      fetchPhonesAndEmailsForDoctor();
    } else {
      const timeoutId = setTimeout(() => {
        fetchPhonesAndEmailsForDoctor();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [doctorName, getDoctorPhonesAndEmails, doctorNames, doctorMobile, doctorEmail, onInfoFetched, onDoctorAutoFill, onInfoClear]);

  return { shouldFetchImmediatelyRef };
};

