/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gCircle;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.gStraight;

public class LineCircleIntersection
extends gPoint {
    private boolean direction;
    static final double distTolerance = 5.0E-5;
    static final double radiusTolerance = 2.0E-4;

    public LineCircleIntersection(GObject straight, GObject circle, boolean positive) {
        super(2);
        this.direction = positive;
        this.AssignParent(0, straight);
        this.AssignParent(1, circle);
    }

    public void Constrain(boolean locusDriving) {
        this.existing = this.parentsExisting();
        if (this.existing) {
            gStraight line = (gStraight)this.getParent(0);
            gCircle circle = (gCircle)this.getParent(1);
            double minRadius2 = circle.getPixelRadius() - 2.0E-4;
            minRadius2 *= minRadius2;
            double maxRadius2 = circle.getPixelRadius() + 2.0E-4;
            maxRadius2 *= maxRadius2;
            double r2 = circle.getPixelRadius();
            r2 *= r2;
            if (line.getdX() == 0.0) {
                double quack = circle.getCenterX() - line.x1;
                if ((quack *= quack) > maxRadius2) {
                    this.existing = false;
                } else {
                    r2 = quack > minRadius2 ? 0.0 : Math.sqrt(r2 - quack);
                    double x1 = circle.getCenterY() - r2;
                    double x2 = circle.getCenterY() + r2;
                    double t1 = (x1 - line.y1) / line.getdY();
                    double t2 = (x2 - line.y1) / line.getdY();
                    if (t2 < t1) {
                        double misc = t1;
                        t1 = t2;
                        t2 = misc;
                        double junk = x1;
                        x1 = x2;
                        x2 = junk;
                    }
                    double fractTolerance = 5.0E-5 / line.getdY();
                    if (this.direction) {
                        if ((line.myStraightType == 1 || line.myStraightType == 0) && t1 < -fractTolerance) {
                            this.existing = false;
                        } else if (line.myStraightType == 0 && t1 > 1.0 + fractTolerance) {
                            this.existing = false;
                        } else {
                            this.y = x1;
                            this.x = line.x1;
                        }
                    } else if (0 == line.myStraightType && t2 > 1.0 + fractTolerance) {
                        this.existing = false;
                    } else if ((1 == line.myStraightType || 0 == line.myStraightType) && t2 < -fractTolerance) {
                        this.existing = false;
                    } else {
                        this.y = x2;
                        this.x = line.x1;
                    }
                }
            } else if (Math.abs(line.slope) > 1.0) {
                double Glope = line.getdX() / line.getdY();
                double GIntercept = line.x1 - Glope * line.y1;
                double A = 1.0 + Glope * Glope;
                double A2 = A + A;
                double misc = GIntercept - circle.getCenterX();
                double B = 2.0 * Glope * misc - 2.0 * circle.getCenterY();
                double A4 = 4.0 * A;
                double B2 = B * B;
                double C = circle.getCenterY() * circle.getCenterY() + misc * misc;
                double maxDisc = C - maxRadius2;
                double minDisc = C - minRadius2;
                maxDisc = B2 - A4 * maxDisc;
                minDisc = B2 - A4 * minDisc;
                if (maxDisc < 0.0) {
                    this.existing = false;
                } else if (minDisc <= 0.0) {
                    this.y = -B / A2;
                    this.x = this.y * Glope + GIntercept;
                } else {
                    misc = Math.sqrt(B2 - A4 * (C -= r2));
                    double x1 = (-B - misc) / A2;
                    double x2 = (-B + misc) / A2;
                    double t1 = (x1 - line.y1) / line.getdY();
                    double t2 = (x2 - line.y1) / line.getdY();
                    if (t2 < t1) {
                        misc = t1;
                        t1 = t2;
                        t2 = misc;
                        double junk = x1;
                        x1 = x2;
                        x2 = junk;
                    }
                    double fractTolerance = Math.abs(5.0E-5 / line.getdY());
                    if (this.direction) {
                        if ((line.myStraightType == 1 || line.myStraightType == 0) && t1 < -fractTolerance) {
                            this.existing = false;
                        } else if (line.myStraightType == 0 && t1 > 1.0 + fractTolerance) {
                            this.existing = false;
                        } else {
                            this.y = x1;
                            this.x = Glope * x1 + GIntercept;
                        }
                    } else if (0 == line.myStraightType && t2 > 1.0 + fractTolerance) {
                        this.existing = false;
                    } else if ((1 == line.myStraightType || 0 == line.myStraightType) && t2 < -fractTolerance) {
                        this.existing = false;
                    } else {
                        this.y = x2;
                        this.x = Glope * x2 + GIntercept;
                    }
                }
            } else {
                double A = 1.0 + line.slope * line.slope;
                double A2 = A + A;
                double misc = line.yintercept - circle.getCenterY();
                double B = 2.0 * line.slope * misc - 2.0 * circle.getCenterX();
                double A4 = 4.0 * A;
                double B2 = B * B;
                double C = circle.getCenterX() * circle.getCenterX() + misc * misc;
                double maxDisc = C - maxRadius2;
                double minDisc = C - minRadius2;
                maxDisc = B2 - A4 * maxDisc;
                minDisc = B2 - A4 * minDisc;
                if (maxDisc < 0.0) {
                    this.existing = false;
                } else if (minDisc <= 0.0) {
                    this.x = -B / A2;
                    this.y = this.x * line.slope + line.yintercept;
                } else {
                    misc = Math.sqrt(B2 - A4 * (C -= r2));
                    A2 = 2.0 * A;
                    double x1 = (-B - misc) / A2;
                    double x2 = (-B + misc) / A2;
                    double t1 = (x1 - line.x1) / line.getdX();
                    double t2 = (x2 - line.x1) / line.getdX();
                    if (t2 < t1) {
                        misc = t1;
                        t1 = t2;
                        t2 = misc;
                        double junk = x1;
                        x1 = x2;
                        x2 = junk;
                    }
                    double fractTolerance = Math.abs(5.0E-5 / line.getdX());
                    if (this.direction) {
                        if ((line.myStraightType == 1 || line.myStraightType == 0) && t1 < -fractTolerance) {
                            this.existing = false;
                        } else if (line.myStraightType == 0 && t1 > 1.0 + fractTolerance) {
                            this.existing = false;
                        } else {
                            this.x = x1;
                            this.y = line.slope * x1 + line.yintercept;
                        }
                    } else if (0 == line.myStraightType && t2 > 1.0 + fractTolerance) {
                        this.existing = false;
                    } else if ((1 == line.myStraightType || 0 == line.myStraightType) && t2 < -fractTolerance) {
                        this.existing = false;
                    } else {
                        this.x = x2;
                        this.y = line.slope * x2 + line.yintercept;
                    }
                }
            }
        }
    }
}

