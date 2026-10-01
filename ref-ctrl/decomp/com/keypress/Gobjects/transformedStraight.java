/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.doublePoint;
import com.keypress.Gobjects.gStraight;

public class transformedStraight
extends gStraight {
    Transformer transform;

    public transformedStraight(GObject[] theParents, Transformer myTransformer) {
        super(((gStraight)theParents[0]).mySketch, theParents.length, ((gStraight)theParents[0]).myStraightType);
        this.AssignParents(theParents);
        this.transform = myTransformer;
    }

    public boolean isColorized() {
        return this.transform.imageIsColorized();
    }

    public void Constrain(boolean locusDriving) {
        boolean bl = this.existing = this.parentsExisting() && this.transform.prepareTransformer(this);
        if (this.existing) {
            gStraight preImage = (gStraight)this.getParent(0);
            doublePoint image = this.transform.imageXY(preImage.x1, preImage.y1);
            this.x1 = image.x;
            this.y1 = image.y;
            image = this.transform.imageXY(preImage.x2, preImage.y2);
            this.x2 = image.x;
            this.y2 = image.y;
            this.updateSecondaryConstraints();
        }
    }
}

