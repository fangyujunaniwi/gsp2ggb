/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.unknownItemListError;
import java.util.Observable;
import java.util.Vector;

public interface JSP_ExternIO {
    public static final int _actionButtons_ItemList = 1;
    public static final int _observableMeasurements_ItemList = 2;
    public static final int _settableParameters_ItemList = 3;

    public Observable getMeasurementObserver(String var1);

    public Double getMeasurementData(String var1);

    public void pressActionButton(String var1);

    public boolean getActionButtonState(String var1);

    public void setParameterData(String var1, double var2);

    public Vector getExternIOItemList(int var1) throws unknownItemListError;

    public int setConstruction(String var1) throws Exception;
}

