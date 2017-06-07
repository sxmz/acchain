#!/bin/bash
readonly PROG_DIR=$(dirname $0)
acchaind=$PROG_DIR/../acchaind
log=$PROG_DIR/../logs/acchain_monitor.log

auto_restart()
{
        status=`$acchaind status`
        if [ "$status" == "Acchain server is not running" ];then
                $acchaind restart
                echo "`date +%F' '%H:%M:%S`[error]      Acchain server is not running and restarted" >> $log
        else
                echo "`date +%F' '%H:%M:%S`[info]       Acchain server is running" >> $log
        fi
}

auto_restart
