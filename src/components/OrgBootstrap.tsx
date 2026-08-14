import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useGetMeQuery } from '../redux/slices/orgApi';
import { setOrgContext } from '../redux/slices/orgSlice';

/**
 * Fetches GET /api/me once the user is authenticated and populates org context
 * (organization + activeModules) into orgSlice. Skipped while unauthenticated.
 * The toggleModule mutation invalidates the 'Me' tag, so this refetches and keeps
 * activeModules in sync. Renders nothing.
 */
export const OrgBootstrap = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // refetchOnMountOrArgChange forces a fresh /me whenever the subscription is
  // re-established (e.g. logout → login), so a new user is never served the
  // previous user's cached org context.
  const { data } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (data) {
      dispatch(
        setOrgContext({
          organization: data.organization,
          activeModules: data.activeModules,
        })
      );
    }
  }, [data, dispatch]);

  return null;
};
