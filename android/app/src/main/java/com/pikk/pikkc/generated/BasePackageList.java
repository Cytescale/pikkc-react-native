package com.pikk.pikkc.generated;

import java.util.Arrays;
import java.util.List;
import org.unimodules.core.interfaces.Package;

public class BasePackageList {
  public List<Package> getPackageList() {
    return Arrays.<Package>asList(
        new expo.modules.appauth.AppAuthPackage(),
        new expo.modules.application.ApplicationPackage(),
        new expo.modules.camera.CameraPackage(),
        new expo.modules.constants.ConstantsPackage(),
        new expo.modules.crypto.CryptoPackage(),
        new expo.modules.errorrecovery.ErrorRecoveryPackage(),
        new expo.modules.filesystem.FileSystemPackage(),
        new expo.modules.font.FontLoaderPackage(),
        new expo.modules.google.signin.GoogleSignInPackage(),
        new expo.modules.imageloader.ImageLoaderPackage(),
        new expo.modules.keepawake.KeepAwakePackage(),
        new expo.modules.medialibrary.MediaLibraryPackage(),
        new expo.modules.splashscreen.SplashScreenPackage(),
        new expo.modules.updates.UpdatesPackage(),
        new expo.modules.webbrowser.WebBrowserPackage()
    );
  }
}
