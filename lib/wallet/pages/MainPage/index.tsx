import { useSelector } from "react-redux";
import { useAccount } from "../../hooks/useAccount";
import { useDappList } from "../../hooks/useDappList";
import { useNftList } from "../../hooks/useNftList";
import AppLayout, { LayoutMode } from "../../layouts/AppLayout";
import { RootState } from "../../store";
import Dashboard from "./Dashboard";
import useCheckAvatarPfpValidness from "./hooks/useCheckAvatarPfpValidness";
import TokenList from "./TokenList";

function MainPage() {
  const { accountId, networkId, walletId } = useSelector(
    (state: RootState) => state.appContext
  );
  const appContext = useSelector((state: RootState) => state.appContext);
  console.log("appContext", appContext);
  const { address } = useAccount(accountId);
  // prefetch other tabs' data
  useNftList(address);
  useDappList();

  useCheckAvatarPfpValidness(walletId, address);
  return (
    <AppLayout
      layoutMode={LayoutMode.WITHOUT_HEADER}
      className="flex flex-col gap-4"
    >
      <Dashboard address={address} networkId={networkId} />
      <TokenList />
    </AppLayout>
  );
}

export default MainPage;
