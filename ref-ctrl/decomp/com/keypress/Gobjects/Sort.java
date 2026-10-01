/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Sortable;

public class Sort {
    public static void shell_sort(Sortable[] a) {
        int n = a.length;
        for (int incr = n / 2; incr >= 1; incr /= 2) {
            for (int i = incr; i < n; ++i) {
                Sortable temp = a[i];
                for (int j = i; j >= incr && temp.compare(a[j - incr]) < 0; j -= incr) {
                    a[j] = a[j - incr];
                }
                a[j] = temp;
            }
        }
    }
}

