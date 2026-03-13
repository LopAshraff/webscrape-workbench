const publisherName = process.env.WIN_PUBLISHER_NAME ?? "CN=LopAshraff";
const useDevCert = process.env.WEBSCRAPE_USE_DEV_CERT === "1";
const certSubjectName = process.env.WIN_CERT_SUBJECT ?? (useDevCert ? "CN=LopAshraff" : undefined);
const certSha1 = process.env.WIN_CERT_SHA1;
const certFile = process.env.WIN_CERT_FILE;
const certPassword = process.env.WIN_CSC_KEY_PASSWORD ?? process.env.CSC_KEY_PASSWORD;
const timeStampServer = process.env.WIN_TIMESTAMP_URL ?? "http://timestamp.digicert.com";

const signtoolOptions = {};

if (certSubjectName) {
  signtoolOptions.certificateSubjectName = certSubjectName;
}

if (certSha1) {
  signtoolOptions.certificateSha1 = certSha1;
}

if (certFile) {
  signtoolOptions.certificateFile = certFile;
}

if (certPassword) {
  signtoolOptions.certificatePassword = certPassword;
}

if (Object.keys(signtoolOptions).length > 0) {
  signtoolOptions.publisherName = [publisherName];
  signtoolOptions.rfc3161TimeStampServer = timeStampServer;
}

const hasSigningConfig = Object.keys(signtoolOptions).length > 0;

export default {
  appId: "com.lopashraff.webscrapeworkbench",
  productName: "Webscrape Workbench",
  copyright: "Copyright © 2026 LopAshraff",
  files: [
    "src/**/*",
    "web/**/*",
    "electron/**/*",
    "package.json",
    "package-lock.json",
    "LICENSE"
  ],
  directories: {
    buildResources: "build",
    output: "dist"
  },
  win: {
    icon: "icon.ico",
    signAndEditExecutable: hasSigningConfig,
    target: ["nsis"],
    ...(hasSigningConfig ? { signtoolOptions } : {})
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  }
};
