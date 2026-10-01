/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Sketch;
import com.keypress.Gobjects.Sortable;
import com.keypress.Gobjects.Transformer;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Component;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import java.util.Vector;

public abstract class GObject
implements Sortable {
    static float[] kHairlineDotPattern = new float[]{0.5f, 3.0f};
    static float[] kHairlineDashPattern = new float[]{8.0f, 6.0f};
    static float[] kThinDotPattern = new float[]{0.75f, 3.0f};
    static float[] kThinDashPattern = new float[]{8.0f, 6.0f};
    static float[] kMediumDotPattern = new float[]{3.0f, 6.0f};
    static float[] kMediumDashPattern = new float[]{10.0f, 8.0f};
    static float[] kThickDotPattern = new float[]{5.0f, 8.0f};
    static float[] kThickDashPattern = new float[]{15.0f, 12.0f};
    static final int _DrawOrder_POINTS = 6000;
    static final int _DrawOrder_ACTION = 5000;
    static final int _DrawOrder_TEXT = 5000;
    static final int _DrawOrder_LINES = 4000;
    static final int _DrawOrder_COORDSYS = 3000;
    static final int _DrawOrder_BoundIMAGE = 2000;
    static final int _DrawOrder_INTERIORS = 1000;
    static final int _DrawOrder_FreeIMAGE = 0;
    public static final int _gPointGenera = 0;
    public static final int _gCircleGenera = 1;
    public static final int _gStraightGenera = 2;
    public static final int _gImageGenera = 3;
    public static final int _gPolygonGenera = 4;
    public static final int _gTextGenera = 5;
    public static final int _gActionGenera = 6;
    public static final int _gCoordSysGenera = 7;
    public static final int _gSamplerGenera = 8;
    public static final int _gSamplerCurveGenera = 9;
    public static final float _gThinRadius = 1.0f;
    public static final float _gThickRadius = 3.0f;
    static final float _hairLinePixelWeight = 0.5f;
    static final float _thinLinePixelWeight = 1.0f;
    static final float _mediumLinePixelWeight = 3.0f;
    static final float _thickLinePixelWeight = 5.0f;
    static BasicStroke kHairlineSolidBrush = new BasicStroke(0.5f);
    static BasicStroke kHairlineDotBrush = new BasicStroke(0.5f, 0, 1, 1.0f, kHairlineDotPattern, 0.0f);
    static BasicStroke kHairlineDashBrush = new BasicStroke(0.5f, 0, 1, 1.0f, kHairlineDashPattern, 0.0f);
    static BasicStroke kThinSolidBrush = new BasicStroke(1.0f);
    static BasicStroke kThinDotBrush = new BasicStroke(1.0f, 0, 1, 1.0f, kThinDotPattern, 0.0f);
    static BasicStroke kThinDashBrush = new BasicStroke(1.0f, 0, 1, 1.0f, kThinDashPattern, 0.0f);
    static BasicStroke kMediumSolidBrush = new BasicStroke(3.0f);
    static BasicStroke kMediumDotBrush = new BasicStroke(3.0f, 0, 1, 1.0f, kMediumDotPattern, 0.0f);
    static BasicStroke kMediumDashBrush = new BasicStroke(3.0f, 0, 1, 1.0f, kMediumDashPattern, 0.0f);
    static BasicStroke kThickSolidBrush = new BasicStroke(5.0f);
    static BasicStroke kThickDotBrush = new BasicStroke(5.0f, 0, 1, 1.0f, kThickDotPattern, 0.0f);
    static BasicStroke kThickDashBrush = new BasicStroke(5.0f, 0, 1, 1.0f, kThickDashPattern, 0.0f);
    public static final int _dotPointStyle = 0;
    public static final int _smallPointStyle = 1;
    public static final int _mediumPointStyle = 2;
    public static final int _largePointStyle = 3;
    public static final int _NUM_PointStyles = 4;
    public static final int _solidDashStyle = 0;
    public static final int _dashedDashStyle = 1;
    public static final int _dottedDashStyle = 2;
    public static final int _hairLineWeight = 0;
    public static final int _thinLineWeight = 1;
    public static final int _mediumLineWeight = 2;
    public static final int _thickLineWeight = 3;
    boolean hidden = false;
    boolean existing = true;
    boolean traced = false;
    Color color = Color.black;
    int sortOrderDelta = 0;
    private GObject[] Parents;
    private GObject KnownAncestorWeMightDescendFrom = null;
    private boolean WeDescendFromKnownAncestor;
    int dashStyle;
    int lineWeight;
    int pointStyle;
    private Vector Children;
    String myLabel = null;
    Font myLabelFont = null;

    public final String getLabel() {
        return this.myLabel;
    }

    public final Font getLabelFont() {
        return this.myLabelFont;
    }

    final GObject getParent(int parentIndex) {
        return this.Parents[parentIndex];
    }

    final GObject getChild(int childIndex) {
        return (GObject)this.Children.elementAt(childIndex);
    }

    public void shutDown() {
    }

    public void setFontSize(int newSize) {
        if (this.myLabelFont != null) {
            this.myLabelFont = new Font(this.myLabelFont.getName(), (this.myLabelFont.isBold() ? 1 : 0) * (this.myLabelFont.isItalic() ? 2 : 0), newSize);
        }
    }

    public void setFontName(String newName) {
        if (this.myLabelFont != null) {
            this.myLabelFont = new Font(newName, (this.myLabelFont.isBold() ? 1 : 0) + (this.myLabelFont.isItalic() ? 2 : 0), this.myLabelFont.getSize());
        }
    }

    public void setFontBold() {
        if (this.myLabelFont != null) {
            this.myLabelFont = new Font(this.myLabelFont.getName(), 1 + (this.myLabelFont.isItalic() ? 1 : 0) * 2, this.myLabelFont.getSize());
        }
    }

    public void setFontItalic() {
        if (this.myLabelFont != null) {
            this.myLabelFont = new Font(this.myLabelFont.getName(), 2 + (this.myLabelFont.isBold() ? 1 : 0) * 1, this.myLabelFont.getSize());
        }
    }

    public void setFontPlain() {
        if (this.myLabelFont != null) {
            this.myLabelFont = new Font(this.myLabelFont.getName(), 0, this.myLabelFont.getSize());
        }
    }

    final int getNumParents() {
        return this.Parents.length;
    }

    final int getNumChildren() {
        return this.Children.size();
    }

    public void setColor(Color aColor) {
        this.color = aColor;
    }

    public Color getColor() {
        return this.color;
    }

    public void setLineDash(int newDashStyle) {
        this.dashStyle = newDashStyle;
    }

    public void setLineWeight(int newWeight) {
        this.lineWeight = newWeight;
    }

    public void setPointStyle(int newStyle) {
        this.pointStyle = newStyle;
    }

    public void setHidden(boolean isHidden) {
        this.hidden = isHidden;
    }

    public void setTraced(boolean trace) {
        this.traced = trace;
    }

    public final boolean isTraced() {
        return this.traced;
    }

    public final boolean isVisible() {
        return !this.hidden && this.existing;
    }

    public boolean isHidden() {
        return this.hidden;
    }

    public boolean isColorized() {
        return false;
    }

    public boolean isExisting() {
        return this.existing;
    }

    public GObject(int numParents) {
        this.Parents = new GObject[numParents];
        this.Children = new Vector();
        this.setPointStyle(1);
        this.setLineWeight(1);
        this.setLineDash(0);
    }

    public boolean isClickable() {
        return false;
    }

    public void handleClick(Sketch theSketch) {
    }

    public void stopAndRequePendingAction(Sketch theSketch) {
    }

    public void QueueAction() {
    }

    public void beginPendingAction(Sketch theSketch) {
    }

    public void about() {
        System.out.print("Dragging " + this + "\r\n");
    }

    public final void setLabel(String aLabel, Font aFont) {
        this.myLabel = aLabel;
        this.myLabelFont = aFont;
    }

    public final boolean hasLabel() {
        return this.myLabel != null && this.myLabel.length() != 0;
    }

    public void modifySpeed(double percentage) {
    }

    public void setTextJustification(int newJustification) {
    }

    protected void setLineStroke(Graphics2D iDrawingContext) {
        BasicStroke theStroke = kThinSolidBrush;
        block0 : switch (this.dashStyle) {
            case 0: {
                switch (this.lineWeight) {
                    case 0: {
                        theStroke = kHairlineSolidBrush;
                        break;
                    }
                    case 1: {
                        theStroke = kThinSolidBrush;
                        break;
                    }
                    case 2: {
                        theStroke = kMediumSolidBrush;
                        break;
                    }
                    case 3: {
                        theStroke = kThickSolidBrush;
                    }
                }
                break;
            }
            case 2: {
                switch (this.lineWeight) {
                    case 0: {
                        theStroke = kHairlineDotBrush;
                        break;
                    }
                    case 1: {
                        theStroke = kThinDotBrush;
                        break;
                    }
                    case 2: {
                        theStroke = kMediumDotBrush;
                        break;
                    }
                    case 3: {
                        theStroke = kThickDotBrush;
                    }
                }
                break;
            }
            case 1: {
                switch (this.lineWeight) {
                    case 0: {
                        theStroke = kHairlineDashBrush;
                        break block0;
                    }
                    case 1: {
                        theStroke = kThinDashBrush;
                        break block0;
                    }
                    case 2: {
                        theStroke = kMediumDashBrush;
                        break block0;
                    }
                    case 3: {
                        theStroke = kThickDashBrush;
                    }
                }
            }
        }
        iDrawingContext.setStroke(theStroke);
    }

    public boolean descendsFrom(GObject ancestorParent) {
        if (ancestorParent == this.KnownAncestorWeMightDescendFrom) {
            return this.WeDescendFromKnownAncestor;
        }
        if (ancestorParent == this) {
            this.KnownAncestorWeMightDescendFrom = ancestorParent;
            this.WeDescendFromKnownAncestor = true;
            return this.WeDescendFromKnownAncestor;
        }
        for (int i = 0; i < this.getNumParents(); ++i) {
            if (!this.getParent(i).descendsFrom(ancestorParent)) continue;
            this.KnownAncestorWeMightDescendFrom = ancestorParent;
            this.WeDescendFromKnownAncestor = true;
            return this.WeDescendFromKnownAncestor;
        }
        this.KnownAncestorWeMightDescendFrom = ancestorParent;
        this.WeDescendFromKnownAncestor = false;
        return false;
    }

    public void AssignParent(int parentIndex, GObject parent) {
        this.Parents[parentIndex] = parent;
        parent.AssignChild(this);
    }

    void AssignParents(GObject[] parents) {
        for (int i = 0; i < parents.length; ++i) {
            this.AssignParent(i, parents[i]);
        }
    }

    private void AssignChild(GObject child) {
        this.Children.addElement(child);
    }

    public boolean containsChild(GObject child) {
        return this.Children.contains(child);
    }

    public boolean containsParent(GObject parent) {
        boolean contains = false;
        for (int i = 0; i < this.Parents.length; ++i) {
            if (this.Parents[i] != parent) continue;
            contains = true;
            break;
        }
        return contains;
    }

    final boolean parentsExisting() {
        boolean ret = true;
        for (int i = 0; i < this.Parents.length; ++i) {
            if (this.Parents[i].existing) continue;
            ret = false;
            break;
        }
        return ret;
    }

    final boolean childrenExisting() {
        boolean ret = true;
        for (int i = 0; i < this.Children.size(); ++i) {
            if (this.getChild((int)i).existing) continue;
            ret = false;
            break;
        }
        return ret;
    }

    private boolean checkParents_UnitTest() {
        boolean passing = true;
        for (int j = 0; j < this.getNumParents(); ++j) {
            GObject thisParentGObj = this.getParent(j);
            if (thisParentGObj.containsChild(this)) continue;
            passing = false;
            break;
        }
        return passing;
    }

    private boolean checkChildren_UnitTest() {
        boolean passing = true;
        for (int j = 0; j < this.getNumChildren(); ++j) {
            GObject thisChildGObj = this.getChild(j);
            if (thisChildGObj.containsParent(this)) continue;
            passing = false;
            break;
        }
        return passing;
    }

    public boolean verifyGObject_UnitTest() {
        boolean passing = true;
        if (!this.checkParents_UnitTest()) {
            passing = false;
            System.out.println("checkParents_UnitTest failed for GObject " + this);
        }
        if (!this.checkChildren_UnitTest()) {
            passing = false;
            System.out.println("checkChildren_UnitTest failed for GObject " + this);
        }
        return passing;
    }

    public boolean isDraggable() {
        return false;
    }

    public boolean acceptsUserChanges() {
        return this.isDraggable();
    }

    public boolean isHit(int x, int y) {
        return false;
    }

    public abstract int getGenera();

    public abstract void DrawVisible(Graphics var1);

    public abstract void Constrain(boolean var1);

    abstract int PrintSortOrder();

    public void setSortLayer(int newSortLayer) {
        this.sortOrderDelta = newSortLayer;
    }

    public void setImage(Image anImage, Component componentDestination) {
    }

    public int compare(Sortable b) {
        GObject it;
        int its;
        int mine = this.PrintSortOrder() + this.sortOrderDelta;
        if (mine < (its = (it = (GObject)b).PrintSortOrder() + it.sortOrderDelta)) {
            return -1;
        }
        if (mine == its) {
            return 0;
        }
        return 1;
    }

    public GObject createTransformedImage(GObject[] parents, Transformer myTransform) {
        return null;
    }

    public String externIOItemName(int requestedItemList) {
        return null;
    }
}

