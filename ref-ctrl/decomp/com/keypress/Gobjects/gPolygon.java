/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.AnimatedPoint;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Path;
import com.keypress.Gobjects.PerimeteredGObj;
import com.keypress.Gobjects.PointOnPolygonAnim;
import com.keypress.Gobjects.PolygonPathWalk;
import com.keypress.Gobjects.PolygonalPoint;
import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.gPoint;
import com.keypress.Gobjects.pathWalk;
import com.keypress.Gobjects.transformedPolygon;
import java.awt.Color;
import java.awt.Graphics;

public abstract class gPolygon
extends GObject
implements PerimeteredGObj,
Path {
    double[] VertexX;
    double[] VertexY;
    int[] iVertexX;
    int[] iVertexY;
    private double area;
    private double perimeter;
    boolean areaIsCurrent;
    boolean perimeterIsCurrent;

    final int PrintSortOrder() {
        return 1000;
    }

    public int getGenera() {
        return 4;
    }

    public void DrawVisible(Graphics g) {
        g.setColor(this.color);
        g.fillPolygon(this.iVertexX, this.iVertexY, this.iVertexX.length);
    }

    public gPolygon(GObject[] parents, int numVertices) {
        super(parents.length);
        this.color = Color.yellow;
        this.AssignParents(parents);
        this.VertexX = new double[numVertices];
        this.VertexY = new double[numVertices];
        this.iVertexX = new int[numVertices];
        this.iVertexY = new int[numVertices];
    }

    public GObject createTransformedImage(GObject[] parents, Transformer myTransform) {
        return new transformedPolygon(parents, myTransform);
    }

    private double metrics(boolean wantsArea) {
        double value = 0.0;
        if (wantsArea) {
            if (this.areaIsCurrent) {
                return this.area;
            }
        } else if (this.perimeterIsCurrent) {
            return this.perimeter;
        }
        for (int i = 0; i < this.iVertexX.length; ++i) {
            int j = (i + 1) % this.iVertexX.length;
            if (wantsArea) {
                value += (this.VertexX[i] * this.VertexY[j] - this.VertexX[j] * this.VertexY[i]) / 2.0;
                continue;
            }
            double dX = this.VertexX[i] - this.VertexX[j];
            double dY = this.VertexY[i] - this.VertexY[j];
            value += Math.sqrt(dX * dX + dY * dY);
        }
        value = Math.abs(value);
        if (wantsArea) {
            this.area = value;
            this.areaIsCurrent = true;
        } else {
            this.perimeter = value;
            this.perimeterIsCurrent = true;
        }
        return value;
    }

    public final void invalidatePolygonMetrics() {
        this.areaIsCurrent = false;
        this.perimeterIsCurrent = false;
    }

    public boolean isPerimeterDefined() {
        return true;
    }

    public double getPixelPerimeterValue() {
        return this.metrics(false);
    }

    public double getPixelAreaValue() {
        return this.metrics(true);
    }

    public PolygonalPoint mapOffsetToPoint(double offset) {
        int baseVertex = (int)offset;
        double offsetAlongEdge = offset - (double)baseVertex;
        if (baseVertex == this.iVertexX.length) {
            baseVertex = 0;
        }
        int nextVertex = baseVertex == this.iVertexX.length - 1 ? 0 : baseVertex + 1;
        return new PolygonalPoint(this.VertexX[baseVertex] + offsetAlongEdge * (this.VertexX[nextVertex] - this.VertexX[baseVertex]), this.VertexY[baseVertex] + offsetAlongEdge * (this.VertexY[nextVertex] - this.VertexY[baseVertex]), offset);
    }

    public PolygonalPoint mapPointToNearestEdge(double x, double y) {
        int nearestEdgeBaseVertex = 0;
        int numVertices = this.iVertexX.length;
        double rSlope = 0.0;
        double rBestDistanceSquare = 0.0;
        double rBestEdgeParam = 0.0;
        double closestX = 0.0;
        double closestY = 0.0;
        for (int vertex = 0; vertex < numVertices; ++vertex) {
            int nextVertex = vertex + 1;
            if (nextVertex == numVertices) {
                nextVertex = 0;
            }
            double rDeltaY = this.VertexY[nextVertex] - this.VertexY[vertex];
            double rDeltaX = this.VertexX[nextVertex] - this.VertexX[vertex];
            if (0.0 != rDeltaX) {
                rSlope = rDeltaY / rDeltaX;
            }
            PolygonalPoint rClosestPoint = PolygonalPoint.PolygonalPointClosestToLine(x, y, this.VertexX[vertex], this.VertexY[vertex], rDeltaX, rDeltaY, rSlope, true, true);
            rDeltaX = rClosestPoint.x - x;
            rDeltaY = rClosestPoint.y - y;
            double rCurrentDistanceSquare = rDeltaX * rDeltaX + rDeltaY * rDeltaY;
            if (0 != vertex && !(rCurrentDistanceSquare < rBestDistanceSquare)) continue;
            rBestDistanceSquare = rCurrentDistanceSquare;
            rBestEdgeParam = rClosestPoint.offset;
            closestX = rClosestPoint.x;
            closestY = rClosestPoint.y;
            nearestEdgeBaseVertex = vertex;
        }
        return new PolygonalPoint(closestX, closestY, rBestEdgeParam + (double)nearestEdgeBaseVertex);
    }

    public pathWalk preparePathWalk(int numSamples) {
        PolygonPathWalk ret = new PolygonPathWalk();
        ret.privatePathData = (double)this.iVertexX.length / (double)(numSamples + 1);
        ret.nextVertexOffsetToTour = 0.0;
        return ret;
    }

    public boolean walkPath(pathWalk p, int sample) {
        PolygonPathWalk p2 = (PolygonPathWalk)p;
        double offset = p2.privatePathData * (double)sample;
        if (offset >= p2.nextVertexOffsetToTour) {
            offset = p2.nextVertexOffsetToTour;
            p2.nextVertexOffsetToTour += 1.0;
        }
        PolygonalPoint pointOnPerimeter = this.mapOffsetToPoint(offset);
        p2.sampleX = pointOnPerimeter.x;
        p2.sampleY = pointOnPerimeter.y;
        return true;
    }

    public boolean getPointOnPath(pathWalk oReturn, double iFraction) {
        double offset = iFraction * (double)this.iVertexX.length;
        PolygonalPoint pointOnPerimeter = this.mapOffsetToPoint(offset);
        oReturn.privatePathData = iFraction;
        oReturn.sampleX = pointOnPerimeter.x;
        oReturn.sampleY = pointOnPerimeter.y;
        return true;
    }

    public boolean pathIsClosed() {
        return true;
    }

    public AnimatedPoint CreateAnimatedPoint(gPoint thePoint, Path thePath, double initialSpeed, boolean onceOnly, boolean clockwise) {
        return new PointOnPolygonAnim(thePoint, (gPolygon)thePath, initialSpeed, onceOnly, clockwise);
    }
}

