import styles from "./index.module.scss";
import Typo from "../../components/Typo";
import classnames from "classnames";
import LogoGrey from "../../assets/icons/logo-grey.svg";
import Image from "next/image";

const LoadingPage = () => {
  return (
    <div className={classnames(styles["main-page"])}>
      <Image src={LogoGrey} alt="logo" width={100} height={100} />
      <Typo.Title className={classnames(styles["suiet-title"], "mt-[12px]")}>
        Loading...
      </Typo.Title>
      <Typo.Title
        className={classnames(
          styles["suiet-title"],
          styles["suiet-title--black"]
        )}
      >
        Suiet
      </Typo.Title>
      <Typo.Normal className={classnames(styles["suiet-desc"])}>
        The wallet for everyone
      </Typo.Normal>
    </div>
  );
};

export default LoadingPage;
