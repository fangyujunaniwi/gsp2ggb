/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

public class PolygonalPoint {
    double x;
    double y;
    double offset;

    public PolygonalPoint(double X, double Y, double Offset) {
        this.x = X;
        this.y = Y;
        this.offset = Offset;
    }

    static PolygonalPoint PolygonalPointClosestToLine(double pointOnPlaneX, double pointOnPlaneY, double lineOriginX, double lineOriginY, double deltaX, double deltaY, double slope, boolean clipBelowZero, boolean clipAboveOne) {
        double y;
        double x;
        if (0.0 == deltaX) {
            x = lineOriginX;
            y = pointOnPlaneY;
        } else {
            double rSlopeSquared = slope * slope;
            double rSlope3 = rSlopeSquared + 1.0;
            x = (rSlopeSquared * lineOriginX - slope * lineOriginY) / rSlope3 + (slope * pointOnPlaneY + pointOnPlaneX) / rSlope3;
            y = (lineOriginY - slope * lineOriginX) / rSlope3 + (rSlopeSquared * pointOnPlaneY + slope * pointOnPlaneX) / rSlope3;
        }
        double offset = 0.0 != deltaX && Math.abs(deltaX) > Math.abs(deltaY) ? (x - lineOriginX) / deltaX : (y - lineOriginY) / deltaY;
        if (clipBelowZero && offset < 0.0) {
            offset = 0.0;
            x = lineOriginX;
            y = lineOriginY;
        } else if (clipAboveOne && offset > 1.0) {
            offset = 1.0;
            x = lineOriginX + deltaX;
            y = lineOriginY + deltaY;
        }
        return new PolygonalPoint(x, y, offset);
    }
}

