/*
 * Decompiled with CFR 0.152.
 */
import com.keypress.Gobjects.Build;
import com.keypress.Gobjects.EtchedFrame;
import com.keypress.Gobjects.JSP_ExternIO;
import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.SketchpadRuntimeServices;
import com.keypress.Gobjects.Util;
import com.keypress.Gobjects.appletImageFetcher;
import com.keypress.Gobjects.unknownItemListError;
import java.applet.Applet;
import java.awt.BorderLayout;
import java.awt.TextArea;
import java.net.URL;
import java.util.Observable;
import java.util.Vector;

public class GSP
extends Applet
implements JSP_ExternIO,
SketchpadRuntimeServices {
    Sketch appletSketch = null;
    static int DEBUG_MODE = 0;
    private boolean firstTime = true;
    String errorString = null;

    public Observable getMeasurementObserver(String measureID) {
        if (this.appletSketch != null) {
            return this.appletSketch.getMeasurementObserver(measureID);
        }
        return null;
    }

    public Double getMeasurementData(String measureID) {
        if (this.appletSketch != null) {
            return this.appletSketch.getMeasurementData(measureID);
        }
        return null;
    }

    public void pressActionButton(String actionID) {
        if (this.appletSketch != null) {
            this.appletSketch.pressActionButton(actionID);
        }
    }

    public boolean getActionButtonState(String actionID) {
        if (this.appletSketch != null) {
            return this.appletSketch.getActionButtonState(actionID);
        }
        return false;
    }

    public int setConstruction(String newConstruction) {
        if (this.appletSketch != null) {
            try {
                this.appletSketch.setConstruction(newConstruction);
            }
            catch (Exception e) {
                this.errorString = e.toString();
            }
        }
        return 0;
    }

    public void setParameterData(String parameterID, double newValue) {
        if (this.appletSketch != null) {
            this.appletSketch.setParameterData(parameterID, newValue);
        }
    }

    public Vector getExternIOItemList(int requestedItemList) throws unknownItemListError {
        if (this.appletSketch != null) {
            return this.appletSketch.getExternIOItemList(requestedItemList);
        }
        return null;
    }

    public final void displayStatusText(String statusText) {
        this.showStatus(statusText);
    }

    public void displayJSPAboutBox() {
        try {
            String URLString = "http://www.dynamicgeometry.com/java_gsp/jsp_about.html";
            URLString = URLString + "?u=" + this.getDocumentBase();
            this.getAppletContext().showDocument(new URL(URLString), "About JavaSketchpad");
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    public final String getSketchParameterValue(String paramName) {
        return this.getParameter(paramName);
    }

    public void init() {
        if (DEBUG_MODE != 0) {
            System.out.print("Entering GSP.init()\r\n");
        }
        this.appletSketch = new Sketch(this, new appletImageFetcher(this));
        this.setLayout(new BorderLayout());
        if (1 == Util.getIntParameter(this, "Frame", 0, 1, 1)) {
            EtchedFrame frame = new EtchedFrame(this.appletSketch);
            this.add("Center", frame);
        } else {
            this.add("Center", this.appletSketch);
        }
        if (DEBUG_MODE != 0) {
            System.out.print("Exiting GSP.init()\r\n");
        }
        System.out.println("\nJavaSketchpad DR" + Build._JavaSketchpadDeveloperReleaseVersion + "(g" + Build._JavaSketchpadGrammarVersion + ") Build " + Build._JavaSketchpadBuildNumber);
        this.firstTime = true;
    }

    public void start() {
        if (this.firstTime) {
            if (null == this.errorString) {
                try {
                    this.appletSketch.startup();
                }
                catch (Exception e) {
                    this.errorString = e.toString();
                }
            }
            this.firstTime = false;
        }
        if (null != this.errorString) {
            TextArea errorDisplay = new TextArea(this.errorString);
            this.removeAll();
            errorDisplay.setEditable(false);
            this.add("Center", new EtchedFrame(errorDisplay));
            this.appletSketch = null;
        } else {
            this.appletSketch.beginPendingActions();
        }
    }

    public void stop() {
        if (null != this.appletSketch) {
            this.appletSketch.stopAndRequePendingActions();
        }
    }
}

