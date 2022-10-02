
/*--------------------------------------------------------------------------
  
  自身を中心とした指定範囲内に存在するユニット数に応じて、戦闘能力が変化するスキルです。
  
■使用方法
1:当スクリプトファイルを「Plugin」フォルダ内にコピー&ペーストします。
2:スキルでカスタムを選択し、キーワードにMeleeを設定します。
  スキルのカスパラには以下を設定すること。

  {
    bonus_atk:1,    // ユニット1体ごとに適用される攻撃力補正値
    bonus_def:-1,   // ユニット1体ごとに適用される防御力補正値
    max_count:4,    // 能力値補正にかかる倍率となるユニット数上限値
    min_count:2,    // スキル発動の為に最低でも必要なユニット数
    border_range:2, // スキル所持者を中心に何マス以内のユニットを対象とするか
    UnitMask:{
        PLAYER:true,    // 自軍をカウント対象にするか(true:する/false:しない)
        ENEMY:true,     // 敵軍をカウント対象にするか(true:する/false:しない)
        ALLY:true       // 同盟軍をカウント対象にするか(true:する/false:しない)
    }
  }

  上記の例では、周囲2マス以内に2体以上のユニットがいる場合、攻撃が+1*n、防御が-1*n補正されます。
  (自軍・敵軍・同盟軍問わない。最大4体までなので、受ける補正値の範囲は攻撃+2～4/防御-2～4)

  UnitMask内の各フラグを切り替えることで、周囲nマス内にいる自軍ユニットの数だけパワーアップする、
  周囲nマス以内にいる敵軍ユニットの数だけ弱体化　など応用が可能となります。

  
■作成者:
cacao99/苦すぎ注意
  
■更新履歴:
2022/10/02　公開

■対応バージョン
SRPG Studio Version:1.263

■規約
・利用はSRPG Studioを使ったゲームに限ります。
・商用・非商用問わず無償でご利用いただけます。
・クレジット明記は特に必要ありませんが、明記いただく際は「苦すぎ注意」でお願いいたします。
・修正、再配布、転載可能です。
・SRPG Studio wiki掲載　OK
・SRPG Studio利用規約は遵守してください。
--------------------------------------------------------------------------*/

(function() {
    var alias3 = SupportCalculator.createTotalStatus;
    SupportCalculator.createTotalStatus = function(unit) {
        var totalStatus = alias3.call(this, unit);
        
        if (SkillControl.getPossessionCustomSkill(unit,'Melee'))  
        {
            var skill = SkillControl.getPossessionCustomSkill(unit,'Melee');
            var unitcount = MeleeSkill._RangeCheck(unit, skill);
            // スキルで設定した最小人数を上回るなら発動
            if (unitcount >= skill.custom.min_count) {
                // スキルで設定した範囲内の人数へクリップする
                if (unitcount > skill.custom.max_count) {
                    unitcount = skill.custom.max_count;
                }
                totalStatus.powerTotal += skill.custom.bonus_atk * unitcount;
                totalStatus.defenseTotal += skill.custom.bonus_def * unitcount;
            }
        }
        
        return totalStatus;
    }

    var MeleeSkill = {
        _RangeCheck: function(unit,skill){

            //SceneType.RESTの時に該当スキル所持者のステータス画面を開くと落ちる。
            //SceneType.RESTでは変数listにはGameSessionオブジェクトが返らないため異常となる。
            if(root.getCurrentScene() === SceneType.REST){
                return false;
            }

            var total = 0;
            var list;
            // 自身の一定範囲にユニットがいないか探す(自軍)
            if (skill.custom.UnitMask.PLAYER == true) {
                list = root.getCurrentSession().getPlayerList();
                total += this._getCountByUnitList(unit, skill, list);
            }
            // 自身の一定範囲にユニットがいないか探す(敵軍)
            if (skill.custom.UnitMask.ENEMY == true) {
                list = root.getCurrentSession().getEnemyList();
                total += this._getCountByUnitList(unit, skill, list);
            }
            // 自身の一定範囲にユニットがいないか探す(同盟軍)
            if (skill.custom.UnitMask.ALLY == true) {
                list = root.getCurrentSession().getAllyList();
                total += this._getCountByUnitList(unit, skill, list);
            }
            //root.log("隣接数(自軍・敵・同盟)"+total);
            return total;
        },

        _getCountByUnitList: function(unit,skill,list) {
            var i,range,otherunit;
            var result_count = 0;
            var count = list.getCount();
            var border_range = skill.custom.border_range;
            for (i=0; i<count;i++){
                otherunit = list.getData(i);
                if(unit === otherunit)
                {
                    //自分自身の場合はスキップ
                    continue;
                }
                else if(otherunit == null)
                {
                    //nullの場合はスキップ
                    continue;
                }
                range = Math.abs(unit.getMapX() - otherunit.getMapX()) + 
                        Math.abs(unit.getMapY() - otherunit.getMapY());
                // もしも一定範囲に味方ユニットがいるならカウントを加算
                if( range <= border_range)
                {
                    result_count++;
                    root.Log("範囲内 "+otherunit.getName()+"との距離:"+range);
                }
            }
            return result_count;
        }
    };
})();
    