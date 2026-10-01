/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AffectedDescendents;
import com.keypress.Gobjects.Axis3;
import com.keypress.Gobjects.Axis4;
import com.keypress.Gobjects.Bisector;
import com.keypress.Gobjects.Build;
import com.keypress.Gobjects.CircleCenterAndRadius;
import com.keypress.Gobjects.CircleCenterPoint;
import com.keypress.Gobjects.CircleCircleIntersection;
import com.keypress.Gobjects.CircleInterior;
import com.keypress.Gobjects.ColorizedGrayscale;
import com.keypress.Gobjects.ColorizedHSV;
import com.keypress.Gobjects.ColorizedRGB;
import com.keypress.Gobjects.ColorizedSpectrum;
import com.keypress.Gobjects.CompoundMeasure;
import com.keypress.Gobjects.ConcatText;
import com.keypress.Gobjects.CoordSysByAxes;
import com.keypress.Gobjects.CoordinatePair;
import com.keypress.Gobjects.Dilation;
import com.keypress.Gobjects.Dilation2S;
import com.keypress.Gobjects.Dilation3R;
import com.keypress.Gobjects.DilationMR;
import com.keypress.Gobjects.Draggable;
import com.keypress.Gobjects.DriverPoint;
import com.keypress.Gobjects.FixedAngleMarkedDistance;
import com.keypress.Gobjects.FixedPoint;
import com.keypress.Gobjects.FixedText;
import com.keypress.Gobjects.FreePoint;
import com.keypress.Gobjects.Function;
import com.keypress.Gobjects.FunctionPlot;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.HideButton;
import com.keypress.Gobjects.JSP_ExternIO;
import com.keypress.Gobjects.LineCircleIntersection;
import com.keypress.Gobjects.LineThru2Points;
import com.keypress.Gobjects.LinearIntersection;
import com.keypress.Gobjects.MarkedAngleMarkedDistance;
import com.keypress.Gobjects.MarkedAngleRotation;
import com.keypress.Gobjects.MeasuredAngleFixDistance;
import com.keypress.Gobjects.MeasuredAngleRotation;
import com.keypress.Gobjects.Midpoint;
import com.keypress.Gobjects.OriginUnitCoords;
import com.keypress.Gobjects.Parallel;
import com.keypress.Gobjects.Parameter;
import com.keypress.Gobjects.PeggedText;
import com.keypress.Gobjects.Perpendicular;
import com.keypress.Gobjects.PlotFixedXY;
import com.keypress.Gobjects.PlotXY;
import com.keypress.Gobjects.PointOnCircle;
import com.keypress.Gobjects.PointOnPolygon;
import com.keypress.Gobjects.PointOnSamplerCurve;
import com.keypress.Gobjects.PointOnStraight;
import com.keypress.Gobjects.PolygonByVertices;
import com.keypress.Gobjects.RayThru2Points;
import com.keypress.Gobjects.RectangularUnitPoint;
import com.keypress.Gobjects.Reflection;
import com.keypress.Gobjects.Rotation;
import com.keypress.Gobjects.Sampler;
import com.keypress.Gobjects.ScreenUpdateThread;
import com.keypress.Gobjects.SegmentThru2Points;
import com.keypress.Gobjects.ShowButton;
import com.keypress.Gobjects.SimpleLock;
import com.keypress.Gobjects.SimpleMeasure;
import com.keypress.Gobjects.SimpleUnitPoint;
import com.keypress.Gobjects.SimultaneousButton;
import com.keypress.Gobjects.SketchpadRuntimePanel;
import com.keypress.Gobjects.SketchpadRuntimeServices;
import com.keypress.Gobjects.Sort;
import com.keypress.Gobjects.SquareUnitPoint;
import com.keypress.Gobjects.ToggleVisibilityButton;
import com.keypress.Gobjects.Translation;
import com.keypress.Gobjects.UnitCircleCoords;
import com.keypress.Gobjects.Util;
import com.keypress.Gobjects.VectorTranslation;
import com.keypress.Gobjects.animationAction;
import com.keypress.Gobjects.gAction;
import com.keypress.Gobjects.gImage;
import com.keypress.Gobjects.gImageBetweenPoints;
import com.keypress.Gobjects.gImageOnPoint;
import com.keypress.Gobjects.gMeasure;
import com.keypress.Gobjects.imageFetcher;
import com.keypress.Gobjects.moveAction;
import com.keypress.Gobjects.parsingSyntaxError;
import com.keypress.Gobjects.unknownItemListError;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.RenderingHints;
import java.util.Observable;
import java.util.Vector;

public class Sketch
extends SketchpadRuntimePanel
implements JSP_ExternIO {
    static boolean BUILD_WITH_JAVA11_EVENTS = false;
    int DEBUG_MODE;
    static int ABOUT_BUTTON_hINSET = 3;
    static int ABOUT_BUTTON_vINSET = 1;
    static String ABOUT_BUTTON_TEXT = "?";
    static int BUILD_NUMBER_hINSET = 3;
    static int BUILD_NUMBER_vINSET = 1;
    static String BUILD_NUMBER_TEXT = "Build " + Build._JavaSketchpadBuildNumber;
    boolean showBuildNum;
    long DEBUG_startTime = 0L;
    public static int FRAMERATE_MILLISECS = 30;
    private int draggedPoint = -1;
    private SimpleLock GObjectsLock = new SimpleLock();
    private SimpleLock UpdaterLock = new SimpleLock();
    private int numContinuousScreenUpdateProcess = 0;
    GObject[] GObjs;
    ScreenUpdateThread screenUpdater;
    private Image offscreen = null;
    private Image traces = null;
    private boolean usingOffscreen;
    String construction;
    double angleConversionFactor;
    private boolean aboutMetricsUninitialized = true;
    private boolean anglesAreDirected = true;
    private boolean buildMetricsUninitialized = true;
    private int aboutButtonBoxWidth;
    private int aboutButtonBoxHeight;
    private int aboutButtonBoxBaseline;
    private int buildNumberBoxWidth;
    private int buildNumberBoxHeight;
    private int buildNumberBoxBaseline;
    private boolean tracesNowShowing = false;
    private boolean usingTraces = false;
    private SketchpadRuntimeServices runtimeEnvironment;
    private boolean requestAbout = false;
    imageFetcher imageFetch;
    Font labelFont;
    Font actionFont;
    Font measureFont;
    Font basicFont;
    static int digitsOfPrecision;
    int curPos = 0;
    int len;
    int[] readGObjs;
    double[] readDoubles;
    String[] readStrings;
    int curReadGObj;

    public final int getDebugMode() {
        return this.DEBUG_MODE;
    }

    public final void setDebugMode(int newMode) {
        this.DEBUG_MODE = newMode;
    }

    private SimpleMeasure findExternallySpecifiedMeasurement(String measureID) {
        SimpleMeasure ret = null;
        for (int i = 0; i < this.GObjs.length; ++i) {
            if (!(this.GObjs[i] instanceof SimpleMeasure) || !((SimpleMeasure)this.GObjs[i]).isMyObserverID(measureID)) continue;
            ret = (SimpleMeasure)this.GObjs[i];
            break;
        }
        return ret;
    }

    private gAction findExternallySpecifiedActionButton(String actionID) {
        gAction ret = null;
        for (int i = 0; i < this.GObjs.length; ++i) {
            if (this.GObjs[i].getGenera() != 6 || !this.GObjs[i].getLabel().equals(actionID)) continue;
            ret = (gAction)this.GObjs[i];
            break;
        }
        return ret;
    }

    public Observable getMeasurementObserver(String measureID) {
        SimpleMeasure m = this.findExternallySpecifiedMeasurement(measureID);
        if (m == null) {
            return null;
        }
        return m.myObserver();
    }

    public Double getMeasurementData(String measureID) {
        SimpleMeasure m = this.findExternallySpecifiedMeasurement(measureID);
        if (m == null) {
            return null;
        }
        return m.getData();
    }

    public void pressActionButton(String actionID) {
        gAction a = this.findExternallySpecifiedActionButton(actionID);
        if (a != null) {
            a.handleClick(this);
        }
    }

    public boolean getActionButtonState(String actionID) {
        gAction a = this.findExternallySpecifiedActionButton(actionID);
        if (a != null) {
            return a.isClicked();
        }
        return false;
    }

    public synchronized void setParameterData(String parameterID, double newValue) {
        Parameter m = (Parameter)this.findExternallySpecifiedMeasurement(parameterID);
        if (m != null) {
            this.GObjectsLock.wait_and_get_lock("mouseDrag");
            m.dragTo(newValue, 0.0, false);
            this.GObjectsLock.release_lock();
            this.paint(this.getGraphics());
        }
    }

    public synchronized int setConstruction(String newConstruction) throws Exception {
        this.construction = newConstruction;
        this.InitObjects();
        this.repaint();
        return 2;
    }

    public Vector getExternIOItemList(int requestedItemList) throws unknownItemListError {
        if (requestedItemList == 1 || requestedItemList == 2 || requestedItemList == 3) {
            Vector<String> ret = new Vector<String>();
            for (int i = 0; i < this.GObjs.length; ++i) {
                String itemID = this.GObjs[i].externIOItemName(requestedItemList);
                if (itemID == null) continue;
                ret.addElement(itemID);
            }
            return ret;
        }
        throw new unknownItemListError(requestedItemList);
    }

    public boolean verifySketch_UnitTest() {
        boolean passing = true;
        for (int i = 0; i < this.GObjs.length; ++i) {
            if (this.GObjs[i].verifyGObject_UnitTest()) continue;
            passing = false;
            System.out.println("verifyGObject_UnitTest failed for GObjs[" + i + "]");
        }
        return passing;
    }

    public Color getSketchBackColor() {
        return this.getBackground();
    }

    public void setSketchBackColor(Color b) {
        this.setBackground(b);
        this.repaint();
    }

    public synchronized void AddContinuousScreenUpdatingTask() {
        this.UpdaterLock.wait_and_get_lock("AddContinuous");
        boolean createThread = this.numContinuousScreenUpdateProcess == 0;
        ++this.numContinuousScreenUpdateProcess;
        this.UpdaterLock.release_lock();
        this.paint(this.getGraphics());
        if (createThread) {
            this.screenUpdater = new ScreenUpdateThread(this);
            this.screenUpdater.start();
        }
    }

    public synchronized void RemoveContinuousScreenUpdatingTask() {
        boolean repaintFinal = false;
        this.UpdaterLock.wait_and_get_lock("RemoveContinuous");
        --this.numContinuousScreenUpdateProcess;
        if (this.numContinuousScreenUpdateProcess == 0) {
            this.screenUpdater.stop();
            this.screenUpdater = null;
            repaintFinal = true;
        }
        this.UpdaterLock.release_lock();
        if (repaintFinal) {
            this.paint(this.getGraphics());
        }
    }

    public void InitObjects() throws Exception {
        if (this.DEBUG_MODE > 1) {
            this.DEBUG_startTime = System.currentTimeMillis();
        }
        this.parseConstruction();
        if (this.DEBUG_MODE > 1) {
            System.out.print(this.GObjs.length + " gobjs.\r\n");
        }
        for (int i = 0; i < this.GObjs.length; ++i) {
            if (this.DEBUG_MODE > 0 && i % 8 == 0) {
                this.runtimeEnvironment.displayStatusText("Configuring geometry (" + 100 * i / this.GObjs.length + "%)...");
            }
            if (this.GObjs[i].acceptsUserChanges()) {
                int j;
                AffectedDescendents descendents = ((Draggable)((Object)this.GObjs[i])).getAffectedDescendents();
                for (j = i + 1; j < this.GObjs.length; ++j) {
                    if (!this.GObjs[j].descendsFrom(this.GObjs[i])) continue;
                    descendents.countDescendent(this.GObjs[j]);
                }
                descendents.allocateAffectedDescendents();
                for (j = i + 1; j < this.GObjs.length; ++j) {
                    if (!this.GObjs[j].descendsFrom(this.GObjs[i])) continue;
                    descendents.addDescendent(this.GObjs[j]);
                }
            }
            this.GObjs[i].Constrain(false);
        }
        Sort.shell_sort(this.GObjs);
        if (this.DEBUG_MODE > 0) {
            this.runtimeEnvironment.displayStatusText("");
        }
        if (this.DEBUG_MODE > 1) {
            this.DEBUG_startTime = System.currentTimeMillis() - this.DEBUG_startTime;
            System.out.print("InitObjs() took " + this.DEBUG_startTime + " ms\r\n");
            this.DEBUG_startTime = 0L;
        }
    }

    private void clearTraces(boolean refreshScreen) {
        this.tracesNowShowing = false;
        Graphics g = this.traces.getGraphics();
        g.setColor(this.getBackground());
        g.fillRect(0, 0, this.size().width, this.size().height);
        g.dispose();
        if (refreshScreen) {
            this.paint(this.getGraphics());
        }
    }

    private boolean OffscreenGraphicsAreCurrent(Image anOffscreenImage) {
        return anOffscreenImage != null && anOffscreenImage.getWidth(null) == this.size().width && anOffscreenImage.getHeight(null) == this.size().height;
    }

    public void update(Graphics g) {
        this.paint(g);
    }

    public synchronized void paint(Graphics screenGraphics) {
        Graphics2D g2d = (Graphics2D)screenGraphics;
        RenderingHints rh = new RenderingHints(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHints(rh);
        try {
            FontMetrics fm;
            Graphics drawInto;
            Graphics traceGraphics;
            if (this.usingTraces) {
                if (!this.OffscreenGraphicsAreCurrent(this.traces)) {
                    this.traces = this.createImage(this.size().width, this.size().height);
                    Util.waitForImage(this, this.traces);
                }
                traceGraphics = this.traces.getGraphics();
                ((Graphics2D)traceGraphics).setRenderingHints(rh);
            } else {
                traceGraphics = null;
            }
            if (this.usingOffscreen) {
                if (!this.OffscreenGraphicsAreCurrent(this.offscreen)) {
                    this.offscreen = this.createImage(this.size().width, this.size().height);
                    if (this.DEBUG_MODE > 1) {
                        System.out.print("Creating offscreen [" + this.size().width + ", " + this.size().height + "]\r\n");
                    }
                    Util.waitForImage(this, this.offscreen);
                }
                drawInto = this.offscreen.getGraphics();
                ((Graphics2D)drawInto).setRenderingHints(rh);
            } else {
                drawInto = screenGraphics;
            }
            boolean needsTraceButton = this.tracesNowShowing;
            if (this.aboutMetricsUninitialized) {
                this.aboutMetricsUninitialized = false;
                fm = drawInto.getFontMetrics(this.basicFont);
                this.aboutButtonBoxWidth = ABOUT_BUTTON_hINSET + ABOUT_BUTTON_hINSET + fm.stringWidth(ABOUT_BUTTON_TEXT) + 1;
                this.aboutButtonBoxHeight = 3 + ABOUT_BUTTON_vINSET + ABOUT_BUTTON_vINSET + fm.getAscent();
                this.aboutButtonBoxBaseline = fm.getAscent() + (ABOUT_BUTTON_vINSET + 2);
            }
            if (this.buildMetricsUninitialized) {
                this.buildMetricsUninitialized = false;
                fm = drawInto.getFontMetrics(this.basicFont);
                this.buildNumberBoxWidth = BUILD_NUMBER_hINSET + BUILD_NUMBER_hINSET + fm.stringWidth(BUILD_NUMBER_TEXT) + 1;
                this.buildNumberBoxHeight = 3 + BUILD_NUMBER_vINSET + BUILD_NUMBER_vINSET + fm.getAscent();
                this.buildNumberBoxBaseline = fm.getAscent() + BUILD_NUMBER_vINSET + 2;
            }
            this.UpdaterLock.wait_and_get_lock("paint(Update)");
            int junk = this.numContinuousScreenUpdateProcess;
            this.UpdaterLock.release_lock();
            Dimension screenBounds = this.size();
            if (this.usingTraces) {
                drawInto.drawImage(this.traces, 0, 0, this);
            } else {
                drawInto.setColor(this.getBackground());
                drawInto.fillRect(0, 0, screenBounds.width, screenBounds.height);
            }
            this.GObjectsLock.wait_and_get_lock("paint(GObjects)");
            try {
                for (int i = 0; i < this.GObjs.length; ++i) {
                    if (!this.GObjs[i].isVisible()) continue;
                    this.GObjs[i].DrawVisible(drawInto);
                    if (!this.GObjs[i].isTraced()) continue;
                    boolean preserveLabel = this.GObjs[i].hasLabel();
                    String oldLabel = null;
                    Font oldLabelFont = null;
                    Color oldColor = this.GObjs[i].getColor();
                    this.GObjs[i].setColor(oldColor.brighter().brighter());
                    if (preserveLabel) {
                        oldLabel = this.GObjs[i].getLabel();
                        oldLabelFont = this.GObjs[i].getLabelFont();
                        this.GObjs[i].setLabel(null, oldLabelFont);
                    }
                    this.GObjs[i].DrawVisible(traceGraphics);
                    if (preserveLabel) {
                        this.GObjs[i].setLabel(oldLabel, oldLabelFont);
                    }
                    this.GObjs[i].setColor(oldColor);
                    this.tracesNowShowing = true;
                }
            }
            catch (Exception e) {
                // empty catch block
            }
            this.GObjectsLock.release_lock();
            if (this.DEBUG_MODE > 1) {
                ++this.DEBUG_startTime;
                drawInto.drawString(junk + "/" + this.DEBUG_startTime, this.size().width - 30, 15);
            }
            int x = this.size().width;
            int y = this.size().height;
            drawInto.setColor(Color.white);
            drawInto.setFont(this.basicFont);
            drawInto.fillRect(x - this.aboutButtonBoxWidth, y - this.aboutButtonBoxHeight, this.aboutButtonBoxWidth, this.aboutButtonBoxHeight);
            drawInto.setColor(Color.black);
            drawInto.drawRect(x - this.aboutButtonBoxWidth, y - this.aboutButtonBoxHeight, this.aboutButtonBoxWidth - 1, this.aboutButtonBoxHeight - 1);
            drawInto.drawString(ABOUT_BUTTON_TEXT, x + ABOUT_BUTTON_hINSET - this.aboutButtonBoxWidth, y - this.aboutButtonBoxHeight + this.aboutButtonBoxBaseline);
            if (this.showBuildNum) {
                x = this.size().width;
                y = this.size().height;
                drawInto.setColor(Color.white);
                drawInto.setFont(this.basicFont);
                drawInto.fillRect(0, y - this.buildNumberBoxHeight, this.buildNumberBoxWidth, this.buildNumberBoxHeight);
                drawInto.setColor(Color.black);
                drawInto.drawRect(0, y - this.buildNumberBoxHeight, this.buildNumberBoxWidth - 1, this.buildNumberBoxHeight - 1);
                drawInto.drawString(BUILD_NUMBER_TEXT, BUILD_NUMBER_hINSET, y - this.buildNumberBoxHeight + this.buildNumberBoxBaseline);
            }
            if (needsTraceButton) {
                drawInto.drawRect(x - 2 * this.aboutButtonBoxWidth, y - this.aboutButtonBoxHeight, this.aboutButtonBoxWidth - 1, this.aboutButtonBoxHeight - 1);
                drawInto.setColor(Color.white);
                drawInto.fillRect(x - 2 * this.aboutButtonBoxWidth + 1, y + 1 - this.aboutButtonBoxHeight, this.aboutButtonBoxWidth - 2, this.aboutButtonBoxHeight - 2);
                drawInto.setColor(Color.red);
                int xl = 2 + x - 2 * this.aboutButtonBoxWidth;
                int xr = x - (this.aboutButtonBoxWidth + 4);
                int yt = y + 2 - this.aboutButtonBoxHeight;
                int yb = y - 3;
                drawInto.drawLine(xl, yt, xr, yb);
                drawInto.drawLine(xl++, yb, xr++, yt);
                drawInto.drawLine(xl, yt, xr, yb);
                drawInto.drawLine(xl, yb, xr, yt);
            }
            if (this.usingOffscreen) {
                screenGraphics.drawImage(this.offscreen, 0, 0, this);
                drawInto.dispose();
            }
            if (this.usingTraces) {
                traceGraphics.dispose();
            }
        }
        catch (Exception e) {
            if (this.DEBUG_MODE > 1) {
                System.out.print("Fielding Sketch.paint() exception " + e + "\r\n");
            }
            return;
        }
    }

    private Font getParamFont(SketchpadRuntimeServices runtime, String prefix, String defaultName, int defaultSize, boolean italic, boolean bold) {
        String font_name = runtime.getSketchParameterValue(prefix + "Font");
        if (font_name == null) {
            font_name = defaultName;
        }
        int style = Util.getIntParameter(runtime, prefix + "Bold", 0, 1, bold ? 1 : 0) * 1 + Util.getIntParameter(runtime, prefix + "Italic", 0, 1, italic ? 1 : 0) * 2;
        return new Font(font_name, style, Util.getIntParameter(runtime, prefix + "Size", 2, 100, defaultSize));
    }

    public boolean JSP_handleKey(char key) {
        if (key == '\u03ec' || key == 'r' || key == 'R') {
            this.resetAll();
        } else if (key == '<' || key == '>') {
            double speedModifier = key == '<' ? 0.8 : 1.2;
            this.modifySpeed(speedModifier);
        } else if (key == '?') {
            this.about();
        } else {
            return false;
        }
        return true;
    }

    public Sketch(SketchpadRuntimeServices runtimeEnvironment, imageFetcher imageFetch) {
        this.imageFetch = imageFetch;
        this.angleConversionFactor = Util.getIntParameter(runtimeEnvironment, "MeasureInDegrees", 0, 1, 0) == 1 ? 57.29577951308232 : 1.0;
        this.setBackground(new Color(Util.getIntParameter(runtimeEnvironment, "BackRed", 0, 255, 200), Util.getIntParameter(runtimeEnvironment, "BackGreen", 0, 255, 200), Util.getIntParameter(runtimeEnvironment, "BackBlue", 0, 255, 200)));
        this.construction = runtimeEnvironment.getSketchParameterValue("Construction");
        this.labelFont = this.getParamFont(runtimeEnvironment, "Label", "Helvetica", 12, false, true);
        this.actionFont = this.getParamFont(runtimeEnvironment, "Action", "TimesRoman", 14, false, false);
        this.measureFont = this.getParamFont(runtimeEnvironment, "Measure", "Helvetica", 10, false, false);
        this.anglesAreDirected = 1 == Util.getIntParameter(runtimeEnvironment, "DirectedAngles", 0, 1, 1);
        this.setDebugMode(Util.getIntParameter(runtimeEnvironment, "DiagnosticLevel", 0, 2, 1));
        this.angleConversionFactor = this.angleConversionFactor;
        this.basicFont = new Font("Helvetica", 1, 9);
        this.aboutMetricsUninitialized = true;
        this.runtimeEnvironment = runtimeEnvironment;
        this.usingOffscreen = 1 == Util.getIntParameter(runtimeEnvironment, "Offscreen", 0, 1, 1);
        this.showBuildNum = 1 == Util.getIntParameter(runtimeEnvironment, "ShowBuildNumber", 0, 1, 0);
        float temp = Util.getFloatParameter(runtimeEnvironment, "PixelsPerLengthUnit", 1.0f);
        if ((double)temp == 0.0 || (double)temp < 0.0) {
            temp = 1.0f;
        }
        gMeasure.changePixelsPerLengthUnit(temp);
        digitsOfPrecision = Util.getIntParameter(runtimeEnvironment, "Digits", 0, 20, 3);
        this.SketchpadRegisterEventHandler();
        if (this.DEBUG_MODE > 1) {
            System.out.print("Sketch() constructed" + this + "\r\n");
        }
    }

    public void startup() throws Exception {
        if (Build._JavaSketchpadGrammarVersion < Util.getIntParameter(this.runtimeEnvironment, "MinGrammarVersion", 0, 10000, Build._JavaSketchpadGrammarVersion)) {
            String errorString = this.runtimeEnvironment.getSketchParameterValue("GrammarVersionError");
            if (null == errorString) {
                errorString = "This sketch requires a more recent JavaSketchpad applet.\n\nPlease upgrade from http://www.keypress.com/sketchpad/java_gsp/download_center.html.";
            }
            throw new parsingSyntaxError(errorString, false);
        }
        this.InitObjects();
        if (this.DEBUG_MODE > 1) {
            System.out.print("InitObjects() is done\r\n");
        }
        this.repaint();
        this.beginPendingActions();
        if (this.DEBUG_MODE > 1 && !this.verifySketch_UnitTest()) {
            throw new Exception("Verify Sketch Unit Test failed");
        }
    }

    public void beginPendingActions() {
        for (int i = 0; i < this.GObjs.length; ++i) {
            this.GObjs[i].beginPendingAction(this);
        }
    }

    public void stopAndRequePendingActions() {
        for (int i = 0; i < this.GObjs.length; ++i) {
            this.GObjs[i].stopAndRequePendingAction(this);
        }
    }

    public synchronized void about() {
        try {
            if (this.draggedPoint != -1) {
                this.GObjs[this.draggedPoint].about();
            } else {
                this.runtimeEnvironment.displayJSPAboutBox();
            }
        }
        catch (Exception exception) {
            // empty catch block
        }
    }

    public synchronized void JSP_mousePressed(int x, int y) {
        int i;
        this.draggedPoint = -1;
        if (x >= this.size().width - this.aboutButtonBoxWidth && y >= this.size().height - this.aboutButtonBoxHeight) {
            this.requestAbout = true;
        } else if (this.tracesNowShowing && x >= this.size().width - 2 * this.aboutButtonBoxWidth && y >= this.size().height - this.aboutButtonBoxHeight) {
            this.clearTraces(true);
        } else {
            for (i = 0; i < this.GObjs.length; ++i) {
                if (!this.GObjs[i].isVisible() || !this.GObjs[i].isDraggable() || !this.GObjs[i].isHit(x, y)) continue;
                this.draggedPoint = i;
                i = this.GObjs.length + 1;
            }
        }
        if (this.draggedPoint == -1) {
            for (i = 0; i < this.GObjs.length; ++i) {
                if (!this.GObjs[i].isVisible() || !this.GObjs[i].isClickable() || !this.GObjs[i].isHit(x, y)) continue;
                this.GObjs[i].handleClick(this);
            }
        }
    }

    public synchronized void JSP_mouseReleased() {
        if (this.draggedPoint >= 0) {
            this.draggedPoint = -1;
        }
        if (this.requestAbout) {
            this.requestAbout = false;
            this.about();
        }
    }

    public synchronized void JSP_mouseDragged(int x, int y) {
        if (this.draggedPoint >= 0) {
            this.GObjectsLock.wait_and_get_lock("drag");
            ((Draggable)((Object)this.GObjs[this.draggedPoint])).dragTo(x, y, false);
            this.GObjectsLock.release_lock();
            this.paint(this.getGraphics());
        }
        Thread.yield();
    }

    public void setSize(int w, int h) {
        super.setSize(w, h);
        this.changeSketchSize();
    }

    public void setBounds(int x, int y, int w, int h) {
        super.setBounds(x, y, w, h);
        if (this.GObjs != null) {
            this.changeSketchSize();
        }
    }

    void changeSketchSize() {
        if (this.DEBUG_MODE > 1) {
            System.out.print("Reshaping...\r\n");
        }
        for (int i = 0; i < this.GObjs.length; ++i) {
            this.GObjs[i].Constrain(false);
        }
    }

    private void eatWhiteSpace() {
        char eat = this.construction.charAt(this.curPos);
        while (eat == ' ' || eat == '\n' || eat == '\r') {
            ++this.curPos;
            eat = this.construction.charAt(this.curPos);
        }
        if (eat == '{') {
            while (this.construction.charAt(this.curPos++) != '}') {
            }
            this.eatWhiteSpace();
        }
    }

    private String WordFrom() {
        this.eatWhiteSpace();
        int oldPos = this.curPos;
        while (this.curPos < this.len && this.construction.charAt(this.curPos) != ' ') {
            ++this.curPos;
        }
        return this.construction.substring(oldPos, this.curPos);
    }

    private boolean readMatch(String query) {
        if (query.regionMatches(0, this.construction, this.curPos, query.length())) {
            this.curPos += query.length();
            return true;
        }
        return false;
    }

    private void eatString(String toEat) throws Exception {
        if (!this.readMatch(toEat)) {
            throw new parsingSyntaxError("Expected \"" + toEat + "\" but found \"" + this.WordFrom() + "\"", true);
        }
    }

    private int readTerminatedInteger(String terminator) throws Exception {
        this.eatWhiteSpace();
        int term = this.construction.indexOf(terminator, this.curPos);
        if (term < this.curPos) {
            throw new parsingSyntaxError("Expected an int but found \"" + this.WordFrom() + "\"", true);
        }
        int x = new Integer(this.construction.substring(this.curPos, term));
        this.curPos = term + terminator.length();
        return x;
    }

    private double readTerminatedDouble(String terminator) throws Exception {
        this.eatWhiteSpace();
        int term = this.construction.indexOf(terminator, this.curPos);
        if (term < this.curPos) {
            throw new parsingSyntaxError("Expected a double but found \"" + this.WordFrom() + "\"", true);
        }
        double x = new Double(this.construction.substring(this.curPos, term));
        this.curPos = term + terminator.length();
        return x;
    }

    private void readVariableLengthSpecifier(boolean okayEmpty) throws Exception {
        this.eatWhiteSpace();
        this.eatString("(");
        int oldPos = this.curPos;
        int stop = this.construction.indexOf(")", this.curPos);
        int numParents = okayEmpty ? 0 : 1;
        while (true) {
            int aComma;
            if ((aComma = this.construction.indexOf(",", this.curPos)) == -1 && this.curPos != stop && numParents == 0) {
                ++numParents;
                break;
            }
            if (aComma == -1 || this.curPos == stop) break;
            if (aComma != -1 && okayEmpty && numParents == 0) {
                numParents = 1;
            }
            if (aComma < this.curPos || aComma > stop) break;
            this.curPos = aComma + 1;
            ++numParents;
        }
        if (numParents == 0 && okayEmpty) {
            this.eatWhiteSpace();
            this.readGObjs = new int[numParents];
            this.eatString(")");
            return;
        }
        this.readGObjs = new int[numParents];
        this.curPos = oldPos;
        for (int aParent = 0; aParent < numParents; ++aParent) {
            this.eatWhiteSpace();
            this.readGObjs[aParent] = this.readTerminatedInteger(aParent == numParents - 1 ? ")" : ",") - 1;
        }
    }

    private void readObjectSpecifier(int numParents, int numDoubles, int numStrings) throws Exception {
        int i;
        this.eatWhiteSpace();
        this.eatString("(");
        this.readGObjs = (int[])(numParents > 0 ? new int[numParents] : null);
        this.readDoubles = (double[])(numDoubles > 0 ? new double[numDoubles] : null);
        this.readStrings = numStrings > 0 ? new String[numStrings] : null;
        for (i = 1; i <= numParents; ++i) {
            this.eatWhiteSpace();
            this.readGObjs[i - 1] = this.readTerminatedInteger(i == numParents ? (numDoubles + numStrings == 0 ? ")" : ",") : ",") - 1;
        }
        for (i = 1; i <= numDoubles; ++i) {
            this.eatWhiteSpace();
            this.readDoubles[i - 1] = this.readTerminatedDouble(i == numDoubles + numStrings ? ")" : ",");
        }
        for (i = 1; i <= numStrings; ++i) {
            boolean containsQuotes = false;
            this.eatWhiteSpace();
            this.eatString("'");
            StringBuffer tNewString = new StringBuffer();
            boolean tSingleQuote = false;
            while (true) {
                if (this.construction.charAt(this.curPos) == '\'') {
                    if (!tSingleQuote) {
                        tSingleQuote = true;
                    } else {
                        tNewString.append('\'');
                        tSingleQuote = false;
                    }
                } else {
                    if (tSingleQuote) break;
                    tNewString.append(this.construction.charAt(this.curPos));
                }
                ++this.curPos;
            }
            this.readStrings[i - 1] = tNewString.toString();
            this.eatWhiteSpace();
            if (i < numStrings) {
                this.eatString(",");
            }
            this.eatWhiteSpace();
            if (i != numStrings) continue;
            this.eatString(")");
        }
    }

    private boolean[] readFlagsArray(int numFlags) throws Exception {
        boolean[] result = new boolean[numFlags];
        this.readObjectSpecifier(0, numFlags, 0);
        for (int i = 0; i < numFlags; ++i) {
            result[i] = this.readDoubles[i] != 0.0;
        }
        return result;
    }

    private GObject[] GObjArrayFromReadGObjs() {
        GObject[] result = new GObject[this.readGObjs.length];
        for (int i = 0; i < this.readGObjs.length; ++i) {
            result[i] = this.GObjs[this.readGObjs[i]];
        }
        return result;
    }

    private GObject parseParameter() throws Exception {
        this.readObjectSpecifier(0, 3, 1);
        return new Parameter(this.readStrings[0], this.measureFont, this.readDoubles[0], (int)this.readDoubles[1], (int)this.readDoubles[2], digitsOfPrecision);
    }

    private GObject parseSimpleMeasure(int numGeometryParents, int measureType, double conversionFactor) throws Exception {
        this.readObjectSpecifier(numGeometryParents, 2, 1);
        return new SimpleMeasure(this.readStrings[0], this.measureFont, this.GObjArrayFromReadGObjs(), (int)this.readDoubles[0], (int)this.readDoubles[1], measureType, conversionFactor, digitsOfPrecision);
    }

    private GObject getCalculationSpecifier() throws Exception {
        this.readObjectSpecifier(0, 2, 2);
        int left = (int)this.readDoubles[0];
        int top = (int)this.readDoubles[1];
        String prefix = this.readStrings[0];
        String expr = this.readStrings[1];
        this.readVariableLengthSpecifier(true);
        return new CompoundMeasure(expr, prefix, this.measureFont, this.GObjArrayFromReadGObjs(), left, top, 1.0, digitsOfPrecision);
    }

    private GObject getFunctionSpecifier() throws Exception {
        this.readObjectSpecifier(0, 2, 2);
        int left = (int)this.readDoubles[0];
        int top = (int)this.readDoubles[1];
        String prefix = this.readStrings[0];
        String expr = this.readStrings[1];
        this.readVariableLengthSpecifier(true);
        return new Function(expr, prefix, this.measureFont, this.readGObjs.length, this.GObjArrayFromReadGObjs(), left, top);
    }

    private GObject getAnimateButtonSpecifier() throws Exception {
        this.readObjectSpecifier(0, 2, 1);
        int left = (int)this.readDoubles[0];
        int top = (int)this.readDoubles[1];
        String label = this.readStrings[0];
        this.readVariableLengthSpecifier(false);
        GObject[] parents = this.GObjArrayFromReadGObjs();
        int numPairs = parents.length / 2;
        this.readObjectSpecifier(0, numPairs, 0);
        double[] speeds = new double[numPairs];
        for (int i = 0; i < numPairs; ++i) {
            speeds[i] = this.readDoubles[i];
        }
        return new animationAction(left, top, label, this.actionFont, Color.white, parents, speeds, this.readFlagsArray(numPairs), this.readFlagsArray(numPairs));
    }

    private GObject getTranslationSpecifier() throws Exception {
        GObject ret;
        if (this.readMatch("/MarkedAngle/FixedDistance")) {
            this.readObjectSpecifier(2, 1, 0);
            ret = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new MeasuredAngleFixDistance(this.GObjs[this.readGObjs[1]], this.readDoubles[0]));
        } else if (this.readMatch("/FixedAngle/MarkedDistance")) {
            this.readObjectSpecifier(2, 1, 0);
            ret = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new FixedAngleMarkedDistance(this.GObjs[this.readGObjs[1]], this.readDoubles[0]));
        } else if (this.readMatch("/MarkedAngle/MarkedDistance")) {
            this.readObjectSpecifier(3, 0, 0);
            ret = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new MarkedAngleMarkedDistance(this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[2]]));
        } else {
            this.readObjectSpecifier(1, 2, 0);
            ret = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new Translation(this.readDoubles[0], this.readDoubles[1]));
        }
        return ret;
    }

    private void parseFormatAttributes(GObject me) throws Exception {
        do {
            this.eatWhiteSpace();
            if (this.readMatch("hidden")) {
                me.setHidden(true);
                continue;
            }
            if (this.readMatch("red")) {
                me.setColor(Color.red);
                continue;
            }
            if (this.readMatch("blue")) {
                me.setColor(Color.blue);
                continue;
            }
            if (this.readMatch("magenta")) {
                me.setColor(Color.magenta);
                continue;
            }
            if (this.readMatch("cyan")) {
                me.setColor(Color.cyan);
                continue;
            }
            if (this.readMatch("green")) {
                me.setColor(Color.green);
                continue;
            }
            if (this.readMatch("black")) {
                me.setColor(Color.black);
                continue;
            }
            if (this.readMatch("white")) {
                me.setColor(Color.white);
                continue;
            }
            if (this.readMatch("yellow")) {
                me.setColor(Color.yellow);
                continue;
            }
            if (this.readMatch("hairline")) {
                me.setLineWeight(0);
                continue;
            }
            if (this.readMatch("thin")) {
                me.setLineWeight(1);
                continue;
            }
            if (this.readMatch("mediumLine")) {
                me.setLineWeight(2);
                continue;
            }
            if (this.readMatch("thick")) {
                boolean binaryThickness = 2 > Util.getIntParameter(this.runtimeEnvironment, "MinGrammarVersion", 0, 10000, 0);
                me.setLineWeight(binaryThickness ? 2 : 3);
                continue;
            }
            if (this.readMatch("solid")) {
                me.setLineDash(0);
                continue;
            }
            if (this.readMatch("dashed")) {
                me.setLineDash(1);
                continue;
            }
            if (this.readMatch("dotted")) {
                me.setLineDash(2);
                continue;
            }
            if (this.readMatch("dot")) {
                me.setPointStyle(0);
                continue;
            }
            if (this.readMatch("small")) {
                me.setPointStyle(1);
                continue;
            }
            if (this.readMatch("mediumPoint")) {
                me.setPointStyle(2);
                continue;
            }
            if (this.readMatch("large")) {
                me.setPointStyle(3);
                continue;
            }
            if (this.readMatch("medium")) {
                me.setLineWeight(2);
                me.setPointStyle(2);
                continue;
            }
            if (this.readMatch("layer")) {
                this.readObjectSpecifier(0, 1, 0);
                me.setSortLayer((int)this.readDoubles[0]);
                continue;
            }
            if (this.readMatch("image")) {
                this.readObjectSpecifier(0, 0, 1);
                me.setImage(this.imageFetch.getImageFromURL(this.readStrings[0], false), this);
                continue;
            }
            if (this.readMatch("traced")) {
                me.setTraced(true);
                this.usingTraces = true;
                continue;
            }
            if (this.readMatch("color")) {
                this.readObjectSpecifier(0, 3, 0);
                me.setColor(new Color((int)this.readDoubles[0], (int)this.readDoubles[1], (int)this.readDoubles[2]));
                continue;
            }
            if (this.readMatch("label")) {
                this.readObjectSpecifier(0, 0, 1);
                me.setLabel(this.readStrings[0], this.labelFont);
                continue;
            }
            if (this.readMatch("auto")) {
                me.QueueAction();
                continue;
            }
            if (this.readMatch("suffix")) {
                this.readObjectSpecifier(0, 0, 1);
                ((gMeasure)me).setSuffix(this.readStrings[0]);
                continue;
            }
            if (this.readMatch("justifyLeft")) {
                me.setTextJustification(0);
                continue;
            }
            if (this.readMatch("justifyRight")) {
                me.setTextJustification(1);
                continue;
            }
            if (this.readMatch("justifyCenter")) {
                me.setTextJustification(2);
                continue;
            }
            if (this.readMatch("size")) {
                this.readObjectSpecifier(0, 1, 0);
                me.setFontSize((int)this.readDoubles[0]);
                continue;
            }
            if (this.readMatch("plain")) {
                me.setFontPlain();
                continue;
            }
            if (this.readMatch("bold")) {
                me.setFontBold();
                continue;
            }
            if (this.readMatch("italic")) {
                me.setFontItalic();
                continue;
            }
            if (this.readMatch("font")) {
                this.readObjectSpecifier(0, 0, 1);
                me.setFontName(this.readStrings[0]);
                continue;
            }
            if (this.readMatch("digits")) {
                this.readObjectSpecifier(0, 1, 0);
                if (!(me instanceof gMeasure)) continue;
                ((gMeasure)me).setDigits((int)this.readDoubles[0]);
                continue;
            }
            System.out.println("Unknown format specifier \"" + this.WordFrom() + "\"");
        } while (this.readMatch(","));
        this.eatString("]");
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    private void parseConstruction() throws Exception {
        int numAnticipatedGObjs = 0;
        this.len = this.construction.length();
        for (int i = 0; i < this.len; ++i) {
            if (this.construction.charAt(i) != ';') continue;
            ++numAnticipatedGObjs;
        }
        this.GObjs = new GObject[numAnticipatedGObjs];
        this.curReadGObj = 0;
        this.curPos = 0;
        while (this.curReadGObj < numAnticipatedGObjs) {
            if (this.DEBUG_MODE > 1) {
                System.out.print(this.curReadGObj + "...\r\n");
                try {
                    Thread.sleep(20L);
                }
                catch (Exception e) {
                    // empty catch block
                }
            }
            this.eatWhiteSpace();
            if (this.readMatch("Point on object")) {
                this.readObjectSpecifier(1, 1, 0);
                int hostGenera = this.GObjs[this.readGObjs[0]].getGenera();
                this.GObjs[this.curReadGObj] = hostGenera == 1 ? new PointOnCircle(this.GObjs[this.readGObjs[0]], this.readDoubles[0]) : (hostGenera == 4 ? new PointOnPolygon(this.GObjs[this.readGObjs[0]], this.readDoubles[0]) : (hostGenera == 9 ? new PointOnSamplerCurve(this.GObjs[this.readGObjs[0]], this.readDoubles[0]) : new PointOnStraight(this.GObjs[this.readGObjs[0]], this.readDoubles[0])));
            } else if (this.readMatch("Point")) {
                this.readObjectSpecifier(0, 2, 0);
                this.GObjs[this.curReadGObj] = new FreePoint((int)this.readDoubles[0], (int)this.readDoubles[1]);
            } else if (this.readMatch("Midpoint")) {
                this.readObjectSpecifier(1, 0, 0);
                this.GObjs[this.curReadGObj] = new Midpoint(this.GObjs[this.readGObjs[0]]);
            } else if (this.readMatch("Segment")) {
                this.readObjectSpecifier(2, 0, 0);
                this.GObjs[this.curReadGObj] = new SegmentThru2Points(this, this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[0]]);
            } else if (this.readMatch("Ray")) {
                this.readObjectSpecifier(2, 0, 0);
                this.GObjs[this.curReadGObj] = new RayThru2Points(this, this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[0]]);
            } else if (this.readMatch("Line")) {
                this.readObjectSpecifier(2, 0, 0);
                this.GObjs[this.curReadGObj] = new LineThru2Points(this, this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[0]]);
            } else if (this.readMatch("Circle")) {
                if (this.readMatch(" by radius")) {
                    this.readObjectSpecifier(2, 0, 0);
                    this.GObjs[this.curReadGObj] = new CircleCenterAndRadius(this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]]);
                } else if (this.readMatch(" interior")) {
                    this.readObjectSpecifier(1, 0, 0);
                    this.GObjs[this.curReadGObj] = new CircleInterior(this.GObjs[this.readGObjs[0]]);
                } else {
                    this.readObjectSpecifier(2, 0, 0);
                    this.GObjs[this.curReadGObj] = new CircleCenterPoint(this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]]);
                }
            } else if (this.readMatch("Intersect")) {
                if (this.readMatch("1")) {
                    this.readObjectSpecifier(2, 0, 0);
                    this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].getGenera() == 1 ? new CircleCircleIntersection(this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]], true) : new LineCircleIntersection(this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]], true);
                } else if (this.readMatch("2")) {
                    this.readObjectSpecifier(2, 0, 0);
                    this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].getGenera() == 1 ? new CircleCircleIntersection(this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]], false) : new LineCircleIntersection(this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]], false);
                } else {
                    this.readObjectSpecifier(2, 0, 0);
                    this.GObjs[this.curReadGObj] = new LinearIntersection(this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]]);
                }
            } else if (this.readMatch("Perpendicular")) {
                this.readObjectSpecifier(2, 0, 0);
                this.GObjs[this.curReadGObj] = new Perpendicular(this, this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]]);
            } else if (this.readMatch("Parallel")) {
                this.readObjectSpecifier(2, 0, 0);
                this.GObjs[this.curReadGObj] = new Parallel(this, this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]]);
            } else if (this.readMatch("Bisector")) {
                this.readObjectSpecifier(3, 0, 0);
                this.GObjs[this.curReadGObj] = new Bisector(this, this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[2]]);
            } else if (this.readMatch("Polygon")) {
                this.readVariableLengthSpecifier(false);
                this.GObjs[this.curReadGObj] = new PolygonByVertices(this.GObjArrayFromReadGObjs());
            } else if (this.readMatch("Reflection")) {
                this.readObjectSpecifier(2, 0, 0);
                this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new Reflection(this.GObjs[this.readGObjs[1]]));
            } else if (this.readMatch("Dilation")) {
                if (this.readMatch("/3PtRatio")) {
                    this.readObjectSpecifier(5, 0, 0);
                    this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new Dilation3R(this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[2]], this.GObjs[this.readGObjs[3]], this.GObjs[this.readGObjs[4]], this.GObjs[this.readGObjs[0]].getGenera() == 0));
                } else if (this.readMatch("/SegmentRatio")) {
                    this.readObjectSpecifier(4, 0, 0);
                    this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new Dilation2S(this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[2]], this.GObjs[this.readGObjs[3]], this.GObjs[this.readGObjs[0]].getGenera() == 0));
                } else if (this.readMatch("/MarkedRatio")) {
                    this.readObjectSpecifier(3, 0, 0);
                    this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new DilationMR(this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[2]], this.GObjs[this.readGObjs[0]].getGenera() == 0));
                } else {
                    this.readObjectSpecifier(2, 1, 0);
                    this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new Dilation(this.GObjs[this.readGObjs[1]], this.readDoubles[0], this.GObjs[this.readGObjs[0]].getGenera() == 0));
                }
            } else if (this.readMatch("Rotation/MeasuredAngle")) {
                this.readObjectSpecifier(3, 0, 0);
                this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new MeasuredAngleRotation(this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[2]]));
            } else if (this.readMatch("Rotation/MarkedAngle")) {
                this.readObjectSpecifier(5, 0, 0);
                this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new MarkedAngleRotation(this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[2]], this.GObjs[this.readGObjs[3]], this.GObjs[this.readGObjs[4]]));
            } else if (this.readMatch("Rotation")) {
                this.readObjectSpecifier(2, 1, 0);
                this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new Rotation(this.GObjs[this.readGObjs[1]], this.readDoubles[0]));
            } else if (this.readMatch("PlotXY")) {
                this.readObjectSpecifier(3, 0, 0);
                this.GObjs[this.curReadGObj] = new PlotXY(this.GObjArrayFromReadGObjs());
            } else if (this.readMatch("PlotFixedXY")) {
                this.readObjectSpecifier(1, 2, 0);
                this.GObjs[this.curReadGObj] = new PlotFixedXY(this.GObjArrayFromReadGObjs(), this.readDoubles[0], this.readDoubles[1]);
            } else if (this.readMatch("Translation")) {
                this.GObjs[this.curReadGObj] = this.getTranslationSpecifier();
            } else if (this.readMatch("PolarTranslation")) {
                this.readObjectSpecifier(1, 2, 0);
                this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new Translation(this.readDoubles[0], this.readDoubles[1]));
            } else if (this.readMatch("VectorTranslation")) {
                this.readObjectSpecifier(3, 0, 0);
                this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new VectorTranslation(this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[2]]));
            } else if (this.readMatch("Locus")) {
                this.readObjectSpecifier(3, 1, 0);
                this.GObjs[this.curReadGObj] = Sampler.constructLocus(this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[2]], this.GObjs[this.readGObjs[0]], (int)this.readDoubles[0]);
            } else if (this.readMatch("ImageOnPoint")) {
                this.readObjectSpecifier(1, 0, 1);
                Image theImage = this.imageFetch.getImageFromURL(this.readStrings[0], false);
                this.GObjs[this.curReadGObj] = new gImageOnPoint(this.GObjs[this.readGObjs[0]], theImage, this);
            } else if (this.readMatch("ImageBetweenPoints")) {
                this.readObjectSpecifier(2, 0, 1);
                Image theImage = this.imageFetch.getImageFromURL(this.readStrings[0], false);
                this.GObjs[this.curReadGObj] = new gImageBetweenPoints(this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]], theImage, this);
            } else if (this.readMatch("Image")) {
                this.readObjectSpecifier(0, 2, 1);
                Image theImage = this.imageFetch.getImageFromURL(this.readStrings[0], false);
                this.GObjs[this.curReadGObj] = new gImage(0, (int)this.readDoubles[0], (int)this.readDoubles[1], theImage, this);
            } else if (this.readMatch("MoveButton")) {
                this.readObjectSpecifier(0, 3, 1);
                int left = (int)this.readDoubles[0];
                int top = (int)this.readDoubles[1];
                double slowestSpeed = this.readDoubles[2];
                String name = this.readStrings[0];
                this.readVariableLengthSpecifier(false);
                this.GObjs[this.curReadGObj] = new moveAction(left, top, name, this.actionFont, Color.white, this.GObjArrayFromReadGObjs(), slowestSpeed);
            } else if (this.readMatch("AnimateButton")) {
                this.GObjs[this.curReadGObj] = this.getAnimateButtonSpecifier();
            } else if (this.readMatch("ShowButton")) {
                this.readObjectSpecifier(0, 2, 1);
                this.readVariableLengthSpecifier(false);
                this.GObjs[this.curReadGObj] = new ShowButton((int)this.readDoubles[0], (int)this.readDoubles[1], this.readStrings[0], this.actionFont, Color.white, this.GObjArrayFromReadGObjs());
            } else if (this.readMatch("HideButton")) {
                this.readObjectSpecifier(0, 2, 1);
                this.readVariableLengthSpecifier(false);
                this.GObjs[this.curReadGObj] = new HideButton((int)this.readDoubles[0], (int)this.readDoubles[1], this.readStrings[0], this.actionFont, Color.white, this.GObjArrayFromReadGObjs());
            } else if (this.readMatch("ToggleVisibilityButton")) {
                this.readObjectSpecifier(0, 2, 1);
                this.readVariableLengthSpecifier(false);
                this.GObjs[this.curReadGObj] = new ToggleVisibilityButton((int)this.readDoubles[0], (int)this.readDoubles[1], this.readStrings[0], this.actionFont, Color.white, this.GObjArrayFromReadGObjs());
            } else if (this.readMatch("SimultaneousButton")) {
                this.readObjectSpecifier(0, 2, 1);
                this.readVariableLengthSpecifier(false);
                this.GObjs[this.curReadGObj] = new SimultaneousButton((int)this.readDoubles[0], (int)this.readDoubles[1], this.readStrings[0], this.actionFont, Color.white, this.GObjArrayFromReadGObjs());
            } else if (this.readMatch("AxisX")) {
                this.readObjectSpecifier(1, 0, 0);
                this.GObjs[this.curReadGObj] = new Axis3(this, this.GObjs[this.readGObjs[0]], true);
            } else if (this.readMatch("AxisY")) {
                this.readObjectSpecifier(1, 0, 0);
                this.GObjs[this.curReadGObj] = new Axis3(this, this.GObjs[this.readGObjs[0]], false);
            } else if (this.readMatch("UnitPoint")) {
                this.readObjectSpecifier(1, 1, 0);
                this.GObjs[this.curReadGObj] = new SimpleUnitPoint(this.GObjs[this.readGObjs[0]], this.readDoubles[0], true);
            } else if (this.readMatch("SquareUnitPoint")) {
                this.readObjectSpecifier(1, 0, 0);
                this.GObjs[this.curReadGObj] = new SquareUnitPoint(this.GObjs[this.readGObjs[0]]);
            } else if (this.readMatch("RectangularUnitPoint")) {
                this.readObjectSpecifier(1, 1, 0);
                this.GObjs[this.curReadGObj] = new RectangularUnitPoint(this.GObjs[this.readGObjs[0]], this.readDoubles[0]);
            } else if (this.readMatch("HorizontalAxis")) {
                this.readObjectSpecifier(2, 0, 0);
                this.GObjs[this.curReadGObj] = new Axis4(this, this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]], true);
            } else if (this.readMatch("VerticalAxis")) {
                this.readObjectSpecifier(2, 0, 0);
                this.GObjs[this.curReadGObj] = new Axis4(this, this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]], false);
            } else if (this.readMatch("Parameter")) {
                this.GObjs[this.curReadGObj] = this.parseParameter();
            } else if (this.readMatch("Length")) {
                this.GObjs[this.curReadGObj] = this.parseSimpleMeasure(1, 1, 1.0);
            } else if (this.readMatch("Angle")) {
                this.GObjs[this.curReadGObj] = this.parseSimpleMeasure(3, this.anglesAreDirected ? 12 : 5, this.angleConversionFactor);
            } else if (this.readMatch("Perimeter") || this.readMatch("Circumference")) {
                this.GObjs[this.curReadGObj] = this.parseSimpleMeasure(1, 4, 1.0);
            } else if (this.readMatch("Area")) {
                this.GObjs[this.curReadGObj] = this.parseSimpleMeasure(1, 6, 1.0);
            } else if (this.readMatch("Radius")) {
                this.GObjs[this.curReadGObj] = this.parseSimpleMeasure(1, 9, 1.0);
            } else if (this.readMatch("Ratio/Segments")) {
                this.GObjs[this.curReadGObj] = this.parseSimpleMeasure(2, 8, 1.0);
            } else if (this.readMatch("Ratio/Points")) {
                this.GObjs[this.curReadGObj] = this.parseSimpleMeasure(3, 11, 1.0);
            } else if (this.readMatch("Slope")) {
                this.GObjs[this.curReadGObj] = this.parseSimpleMeasure(1, 7, 1.0);
            } else if (this.readMatch("Distance")) {
                this.readObjectSpecifier(2, 2, 1);
                this.GObjs[this.curReadGObj] = new SimpleMeasure(this.readStrings[0], this.measureFont, this.GObjArrayFromReadGObjs(), (int)this.readDoubles[0], (int)this.readDoubles[1], this.GObjs[this.readGObjs[0]].getGenera() == 0 ? 2 : 3, 1.0, digitsOfPrecision);
            } else if (this.readMatch("Calculate")) {
                this.GObjs[this.curReadGObj] = this.getCalculationSpecifier();
            } else if (this.readMatch("FunctionPlot")) {
                this.readObjectSpecifier(2, 4, 0);
                this.GObjs[this.curReadGObj] = new FunctionPlot(this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]], (int)this.readDoubles[0], this.readDoubles[1], this.readDoubles[2], (int)this.readDoubles[3]);
            } else if (this.readMatch("Function")) {
                this.GObjs[this.curReadGObj] = this.getFunctionSpecifier();
            } else if (this.readMatch("Origin&Unit")) {
                this.readObjectSpecifier(2, 0, 0);
                this.GObjs[this.curReadGObj] = new OriginUnitCoords(this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]], this);
            } else if (this.readMatch("UnitCircle")) {
                this.readObjectSpecifier(1, 0, 0);
                this.GObjs[this.curReadGObj] = new UnitCircleCoords(this.GObjs[this.readGObjs[0]], this);
            } else if (this.readMatch("Coordinates")) {
                this.readObjectSpecifier(2, 2, 1);
                this.GObjs[this.curReadGObj] = new CoordinatePair(this.readStrings[0], this.measureFont, this.GObjArrayFromReadGObjs(), (int)this.readDoubles[0], (int)this.readDoubles[1], false, digitsOfPrecision);
            } else if (this.readMatch("Abscissa")) {
                this.GObjs[this.curReadGObj] = this.parseSimpleMeasure(2, 13, 1.0);
            } else if (this.readMatch("Ordinate")) {
                this.GObjs[this.curReadGObj] = this.parseSimpleMeasure(2, 14, 1.0);
            } else if (this.readMatch("CoordinateDistance")) {
                this.GObjs[this.curReadGObj] = this.parseSimpleMeasure(3, 15, 1.0);
            } else if (this.readMatch("CoordSysByAxes")) {
                this.readObjectSpecifier(2, 0, 0);
                this.GObjs[this.curReadGObj] = new CoordSysByAxes(this.GObjs[this.readGObjs[0]], this.GObjs[this.readGObjs[1]], this);
            } else if (this.readMatch("FixedPoint")) {
                this.readObjectSpecifier(0, 2, 0);
                this.GObjs[this.curReadGObj] = new FixedPoint((int)this.readDoubles[0], (int)this.readDoubles[1]);
            } else if (this.readMatch("DriverPoint")) {
                this.readObjectSpecifier(3, 0, 0);
                this.GObjs[this.curReadGObj] = new DriverPoint(this.GObjArrayFromReadGObjs());
            } else if (this.readMatch("PeggedText")) {
                this.readObjectSpecifier(2, 0, 0);
                this.GObjs[this.curReadGObj] = new PeggedText(this.measureFont, this.GObjArrayFromReadGObjs());
            } else if (this.readMatch("ConcatText")) {
                this.readObjectSpecifier(0, 2, 0);
                int x = (int)this.readDoubles[0];
                int y = (int)this.readDoubles[1];
                this.readVariableLengthSpecifier(false);
                this.GObjs[this.curReadGObj] = new ConcatText(x, y, this.measureFont, this.GObjArrayFromReadGObjs());
            } else if (this.readMatch("FixedText")) {
                this.readObjectSpecifier(0, 2, 1);
                this.GObjs[this.curReadGObj] = new FixedText((int)this.readDoubles[0], (int)this.readDoubles[1], this.readStrings[0], this.measureFont);
            } else {
                if (!this.readMatch("Colorized_")) throw new parsingSyntaxError("Unknown Object Specifier \"" + this.WordFrom() + "\"", true);
                if (this.readMatch("Spectrum")) {
                    this.readObjectSpecifier(2, 3, 0);
                    this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new ColorizedSpectrum(this.GObjs[this.readGObjs[1]], this.readDoubles[0], this.readDoubles[1], (int)this.readDoubles[2]));
                } else if (this.readMatch("Grayscale")) {
                    this.readObjectSpecifier(2, 3, 0);
                    this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new ColorizedGrayscale(this.GObjs[this.readGObjs[1]], this.readDoubles[0], this.readDoubles[1], (int)this.readDoubles[2]));
                } else if (this.readMatch("RGB")) {
                    this.readObjectSpecifier(4, 3, 0);
                    this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new ColorizedRGB(this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[2]], this.GObjs[this.readGObjs[3]], this.readDoubles[0], this.readDoubles[1], (int)this.readDoubles[2]));
                } else {
                    if (!this.readMatch("HSV")) throw new parsingSyntaxError("Unknown Colorized Specifier \"" + this.WordFrom() + "\"", true);
                    this.readObjectSpecifier(4, 3, 0);
                    this.GObjs[this.curReadGObj] = this.GObjs[this.readGObjs[0]].createTransformedImage(this.GObjArrayFromReadGObjs(), new ColorizedHSV(this.GObjs[this.readGObjs[1]], this.GObjs[this.readGObjs[2]], this.GObjs[this.readGObjs[3]], this.readDoubles[0], this.readDoubles[1], (int)this.readDoubles[2]));
                }
            }
            long tx = System.currentTimeMillis();
            this.eatWhiteSpace();
            if (this.readMatch("[")) {
                this.parseFormatAttributes(this.GObjs[this.curReadGObj]);
            }
            this.eatWhiteSpace();
            this.eatString(";");
            if (this.curReadGObj % 8 == 0 && this.DEBUG_MODE > 0) {
                this.runtimeEnvironment.displayStatusText("Opening Sketchpad construction (" + 100 * this.curReadGObj / numAnticipatedGObjs + "%)...");
            }
            ++this.curReadGObj;
        }
        if (this.DEBUG_MODE <= 0) return;
        this.runtimeEnvironment.displayStatusText("");
    }

    public void modifySpeed(double rate) {
        for (int i = 0; i < this.GObjs.length; ++i) {
            this.GObjs[i].modifySpeed(rate);
        }
    }

    public final SimpleLock getGObjectsLock() {
        return this.GObjectsLock;
    }

    public synchronized void resetAll() {
        this.draggedPoint = -1;
        this.GObjectsLock.wait_and_get_lock("paint(GObjects)");
        for (int i = 0; i < this.GObjs.length; ++i) {
            this.GObjs[i].shutDown();
        }
        this.GObjectsLock.release_lock();
        try {
            this.startup();
        }
        catch (Exception exception) {
            // empty catch block
        }
        this.repaint();
        this.beginPendingActions();
    }
}

