/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Util;
import com.keypress.Gobjects.imageFetcher;
import java.applet.Applet;
import java.awt.Image;
import java.net.URL;

public class appletImageFetcher
implements imageFetcher {
    private Applet hostApplet;

    public appletImageFetcher(Applet hostApp) {
        this.hostApplet = hostApp;
    }

    public Image getImageFromURL(String ImageName, boolean waitToLoad) {
        URL codebase = this.hostApplet.getCodeBase();
        Image im = this.hostApplet.getImage(codebase, ImageName);
        if (waitToLoad) {
            Util.waitForImage(this.hostApplet, im);
        }
        return im;
    }
}

