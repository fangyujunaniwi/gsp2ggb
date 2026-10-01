/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.PerimeteredGObj;
import com.keypress.Gobjects.computed3PtRatio;
import com.keypress.Gobjects.computedRadianAngle;
import com.keypress.Gobjects.gCircle;
import com.keypress.Gobjects.gCoordSys;
import com.keypress.Gobjects.gMeasure;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gStraight;
import com.keypress.Gobjects.myObservable;
import java.awt.Font;
import java.util.Observable;

public class SimpleMeasure
extends gMeasure {
    public static final int _LengthM = 1;
    public static final int _DistancePtPtM = 2;
    public static final int _DistancePtLineM = 3;
    public static final int _PerimeterM = 4;
    public static final int _undirectedAngleM = 5;
    public static final int _AreaM = 6;
    public static final int _SlopeM = 7;
    public static final int _Ratio2SegsM = 8;
    public static final int _RadiusM = 9;
    public static final int _DontEvalMe = 10;
    public static final int _Ratio3PtsM = 11;
    public static final int _directedAngleM = 12;
    public static final int _AbscissaM = 13;
    public static final int _OrdinateM = 14;
    public static final int _CoordinateDistanceM = 15;
    double value;
    private int measureType;
    double conversionFactor;
    protected myObservable externalObservable = null;

    public SimpleMeasure(String prefix, Font myFont, GObject[] parents, int baseX, int baseY, int measureType, double ConversionFactor, int digitsOfPrecision) {
        super(prefix, myFont, parents.length, parents, baseX, baseY, digitsOfPrecision);
        this.measureType = measureType;
        this.conversionFactor = ConversionFactor;
    }

    public Observable myObserver() {
        if (this.externalObservable == null) {
            this.externalObservable = new myObservable();
        }
        return this.externalObservable;
    }

    public boolean isMyObserverID(String anObserverID) {
        return anObserverID.equals(this.prefix);
    }

    public String externIOItemName(int requestedItemList) {
        if (requestedItemList == 2 && this.prefix.charAt(0) != '_') {
            return this.prefix;
        }
        return null;
    }

    public Double getData() {
        if (this.existing && this.isDefined) {
            return new Double(this.value);
        }
        return null;
    }

    protected void convertValueToString() {
        if (this.existing) {
            this.valueStr = this.isDefined ? this.roundedDoubleString(this.value) : "undefined";
        }
        if (this.externalObservable != null) {
            this.externalObservable.updateObservers(this.existing && this.isDefined ? new Double(this.value) : null);
        }
    }

    protected void updateValue(boolean updateStringRep) {
        this.existing = this.parentsExisting();
        this.isDefined = true;
        if (this.existing) {
            switch (this.measureType) {
                case 1: {
                    gStraight segment = (gStraight)this.getParent(0);
                    this.value = segment.getPixelLength() / (double)gMeasure.pixelsPerLengthUnit;
                    break;
                }
                case 5: 
                case 12: {
                    gPoint A = (gPoint)this.getParent(0);
                    gPoint B = (gPoint)this.getParent(1);
                    gPoint C = (gPoint)this.getParent(2);
                    computedRadianAngle result = new computedRadianAngle(A.getX(), A.getY(), B.getX(), B.getY(), C.getX(), C.getY());
                    if (result.isDefined()) {
                        this.value = result.angle() * this.conversionFactor;
                        if (this.measureType != 5) break;
                        this.value = Math.abs(this.value);
                        break;
                    }
                    this.isDefined = false;
                    break;
                }
                case 2: {
                    gPoint A = (gPoint)this.getParent(0);
                    gPoint B = (gPoint)this.getParent(1);
                    double dx = A.getX() - B.getX();
                    double dy = A.getY() - B.getY();
                    this.value = Math.sqrt(dx * dx + dy * dy) / (double)gMeasure.pixelsPerLengthUnit;
                    break;
                }
                case 3: {
                    gStraight A = (gStraight)this.getParent(0);
                    gPoint B = (gPoint)this.getParent(1);
                    this.value = A.getdX() == 0.0 ? Math.abs(A.x1 - B.getX()) : Math.abs(A.y1 - B.getY() + A.slope * (B.getX() - A.x1)) / Math.sqrt(A.slope * A.slope + 1.0);
                    this.value /= (double)gMeasure.pixelsPerLengthUnit;
                    break;
                }
                case 4: 
                case 6: {
                    PerimeteredGObj A = (PerimeteredGObj)((Object)this.getParent(0));
                    if (A.isPerimeterDefined()) {
                        this.value = this.measureType == 6 ? A.getPixelAreaValue() / (double)(gMeasure.pixelsPerLengthUnit * gMeasure.pixelsPerLengthUnit) : A.getPixelPerimeterValue() / (double)gMeasure.pixelsPerLengthUnit;
                        break;
                    }
                    this.isDefined = false;
                    break;
                }
                case 9: {
                    this.value = ((gCircle)this.getParent(0)).getPixelRadius() / (double)gMeasure.pixelsPerLengthUnit;
                    break;
                }
                case 7: {
                    gStraight A = (gStraight)this.getParent(0);
                    if (A.getdX() == 0.0) {
                        this.isDefined = false;
                        break;
                    }
                    this.value = -A.slope;
                    break;
                }
                case 8: {
                    gStraight A = (gStraight)this.getParent(0);
                    gStraight B = (gStraight)this.getParent(1);
                    if (B.getdX() == 0.0 && B.getdY() == 0.0) {
                        this.isDefined = false;
                        break;
                    }
                    this.value = A.getPixelLength() / B.getPixelLength();
                    break;
                }
                case 11: {
                    gPoint A = (gPoint)this.getParent(0);
                    gPoint B = (gPoint)this.getParent(1);
                    gPoint C = (gPoint)this.getParent(2);
                    computed3PtRatio z = new computed3PtRatio(A.getX(), A.getY(), B.getX(), B.getY(), C.getX(), C.getY());
                    this.isDefined = z.isDefined();
                    if (!this.isDefined) break;
                    this.value = z.ratio();
                    break;
                }
                case 13: {
                    gPoint p = (gPoint)this.getParent(0);
                    gCoordSys c = (gCoordSys)this.getParent(1);
                    this.value = (p.getX() - c.getOriginX()) / c.getUnitLengthX();
                    break;
                }
                case 14: {
                    gPoint p = (gPoint)this.getParent(0);
                    gCoordSys c = (gCoordSys)this.getParent(1);
                    this.value = -(p.getY() - c.getOriginY()) / c.getUnitLengthY();
                    break;
                }
                case 15: {
                    gPoint A = (gPoint)this.getParent(0);
                    gPoint B = (gPoint)this.getParent(1);
                    gCoordSys c = (gCoordSys)this.getParent(2);
                    double dx = (A.getX() - B.getX()) / c.getUnitLengthX();
                    double dy = (A.getY() - B.getY()) / c.getUnitLengthY();
                    this.value = Math.sqrt(dx * dx + dy * dy);
                    break;
                }
                default: {
                    this.value = -999.99;
                }
            }
        }
        if (updateStringRep) {
            this.convertValueToString();
        }
        if (this.externalObservable != null) {
            this.externalObservable.updateObservers(this.existing && this.isDefined ? new Double(this.value) : null);
        }
    }
}

