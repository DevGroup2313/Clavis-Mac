/*
   @@NAME_UPPER@@  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
   NO LICENCE IS GRANTED. No copying, adaptation, redistribution, reverse
   engineering or commercial use without the author's written permission.
   See LICENCE.txt. Every distributed copy carries a build marker.
*/
package @@ANDROID_ID@@;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import java.io.OutputStream;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

/* @@NAME@@ for Fire tablet and Android, made the way Carpe Diem's tablet app is: one web view holding the page the app
   carries (assets/@@FILE@@.html), served from the app itself at a fixed secure address
   (https://appassets.androidplatform.net), so the library you keep persists on the tablet and the online sources
   answer as they do in a browser. Other sites open in the tablet's browser, never inside the app. Saving a file
   (BibTeX, RIS, the library) asks where to put it. */
public class MainActivity extends Activity {
    private static final String HOME = "appassets.androidplatform.net";
    private WebView web;
    private ValueCallback<Uri[]> filePathCallback;
    private static final int FILE_CHOOSER_REQUEST = 4711;
    private static final int SAVE_FILE_REQUEST = 4712;
    private String pendingSaveB64;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setSupportMultipleWindows(false);
        s.setTextZoom(100);
        web.setBackgroundColor(Color.parseColor("@@BG@@"));
        web.addJavascriptInterface(new Bridge(), "CarpeNative");
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
                return true;
            }
        });
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            /* a link to another site goes to the tablet's browser; the app's own pages stay here */
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (u != null && HOME.equals(u.getHost())) return false;
                openOutside(u);
                return true;
            }
        });
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl("https://" + HOME + "/assets/@@FILE@@.html");
        setContentView(web);
    }

    private void openOutside(Uri u) {
        if (u == null) return;
        String sc = u.getScheme();
        if (sc == null || !(sc.equals("https") || sc.equals("http") || sc.equals("mailto"))) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, u));
        } catch (Exception ignored) {
        }
    }

    public class Bridge {
        @JavascriptInterface
        public boolean saveFile(final String name, final String mime, final String b64) {
            pendingSaveB64 = b64;
            final String type = (mime == null || mime.length() == 0) ? "application/octet-stream" : mime;
            final String fname = (name == null || name.length() == 0) ? "@@FILE@@-export.txt" : name;
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    try {
                        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                        intent.addCategory(Intent.CATEGORY_OPENABLE);
                        intent.setType(type);
                        intent.putExtra(Intent.EXTRA_TITLE, fname);
                        startActivityForResult(intent, SAVE_FILE_REQUEST);
                    } catch (Exception e) {
                        pendingSaveB64 = null;
                    }
                }
            });
            return true;
        }

        @JavascriptInterface
        public boolean openUrl(final String url) {
            runOnUiThread(new Runnable() {
                @Override public void run() { openOutside(Uri.parse(url)); }
            });
            return true;
        }

        @JavascriptInterface
        public String appInfo() {
            return "{\"app\":\"@@NAME@@\",\"build\":\"@@PASS@@\",\"shell\":\"android\"}";
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                filePathCallback = null;
            }
            return;
        }
        if (requestCode == SAVE_FILE_REQUEST) {
            String b64 = pendingSaveB64;
            pendingSaveB64 = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null && b64 != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    if (out != null) out.write(Base64.decode(b64, Base64.DEFAULT));
                } catch (Exception ignored) {
                }
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    /* Back goes back a page inside the app (the search's own Back), and leaves only from the first page */
    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
